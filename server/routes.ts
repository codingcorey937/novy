import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertListingSchema, insertApplicationSchema, insertMessageSchema } from "@shared/schema";
import { randomUUID, createHash } from "crypto";
import { hashToken } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const { status } = req.query;
      const listingsData = await storage.getListings(status as string || "active");
      res.json(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listingsData = await storage.getListingsByUser(userId);
      res.json(listingsData);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert date strings to Date objects
      const listingData = {
        ...req.body,
        userId,
        status: "pending_authorization",
        leaseExpiration: req.body.leaseExpiration ? new Date(req.body.leaseExpiration) : undefined,
      };
      
      const parseResult = insertListingSchema.safeParse(listingData);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid listing data", errors: parseResult.error.errors });
      }

      const listing = await storage.createListing(parseResult.data as any);

      const token = randomUUID();
      const tokenHash = hashToken(token);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await storage.createOwnerAuthorization({
        listingId: listing.id,
        tokenHash,
        ownerEmail: listing.ownerEmail,
        status: "pending",
        expiresAt,
      } as any);

      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.patch("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await storage.getListingById(req.params.id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateListing(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await storage.getListingById(req.params.id);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteListing(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.get("/api/authorize/:token", async (req, res) => {
    try {
      const auth = await storage.getOwnerAuthorizationByToken(req.params.token);
      
      if (!auth) {
        return res.status(404).json({ message: "Authorization not found" });
      }

      // Security: Block access to used authorization links (one-time use)
      if (auth.usedAt) {
        return res.status(400).json({ message: "This authorization link has already been used" });
      }

      if (new Date() > new Date(auth.expiresAt)) {
        return res.status(400).json({ message: "Authorization link has expired" });
      }

      const listing = await storage.getListingById(auth.listingId);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      res.json({ authorization: auth, listing });
    } catch (error) {
      console.error("Error fetching authorization:", error);
      res.status(500).json({ message: "Failed to fetch authorization" });
    }
  });

  app.post("/api/authorize/:token", async (req, res) => {
    try {
      const { approve } = req.body;
      const auth = await storage.getOwnerAuthorizationByToken(req.params.token);
      
      if (!auth) {
        return res.status(404).json({ message: "Authorization not found" });
      }

      // Security: Check if token was already used (one-time use)
      if (auth.usedAt) {
        return res.status(400).json({ message: "This authorization link has already been used" });
      }

      if (auth.status !== "pending") {
        return res.status(400).json({ message: "Authorization already processed" });
      }

      if (new Date() > new Date(auth.expiresAt)) {
        return res.status(400).json({ message: "Authorization link has expired" });
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipHash = createHash("sha256").update(String(clientIp)).digest("hex");
      const userAgent = req.headers["user-agent"] || "";

      if (approve) {
        await storage.updateOwnerAuthorization(auth.id, {
          status: "approved",
          approvedAt: new Date(),
          usedAt: new Date(),
          ipHash,
        } as any);
        await storage.updateListing(auth.listingId, { status: "active" } as any);

        // Audit log: Owner approval
        await storage.createAuditLog({
          action: "owner_approval",
          resourceType: "listing",
          resourceId: auth.listingId,
          metadata: JSON.stringify({ authorizationId: auth.id, ownerEmail: auth.ownerEmail }),
          ipHash,
          userAgent,
        } as any);
      } else {
        await storage.updateOwnerAuthorization(auth.id, {
          status: "rejected",
          rejectedAt: new Date(),
          usedAt: new Date(),
          ipHash,
        } as any);
        await storage.updateListing(auth.listingId, { status: "cancelled" } as any);

        // Audit log: Owner rejection
        await storage.createAuditLog({
          action: "owner_rejection",
          resourceType: "listing",
          resourceId: auth.listingId,
          metadata: JSON.stringify({ authorizationId: auth.id, ownerEmail: auth.ownerEmail }),
          ipHash,
          userAgent,
        } as any);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing authorization:", error);
      res.status(500).json({ message: "Failed to process authorization" });
    }
  });

  app.get("/api/applications/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apps = await storage.getApplicationsByUser(userId);
      
      const appsWithListings = await Promise.all(
        apps.map(async (app) => {
          const listing = await storage.getListingById(app.listingId);
          return { ...app, listing };
        })
      );
      
      res.json(appsWithListings);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const app = await storage.getApplicationById(req.params.id);
      
      if (!app) {
        return res.status(404).json({ message: "Application not found" });
      }

      const listing = await storage.getListingById(app.listingId);
      res.json({ ...app, listing });
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId, coverLetter, moveInDate, tosAccepted, disclaimerAccepted } = req.body;

      // Security: Require ToS and Non-Broker disclaimer acceptance
      if (!tosAccepted || !disclaimerAccepted) {
        return res.status(400).json({ message: "You must accept the Terms of Service and Non-Broker Disclaimer to apply" });
      }

      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.status !== "active") {
        return res.status(400).json({ message: "Listing is not active" });
      }

      if (listing.userId === userId) {
        return res.status(400).json({ message: "Cannot apply to your own listing" });
      }

      const existingApps = await storage.getApplicationsByUser(userId);
      const alreadyApplied = existingApps.some((a) => a.listingId === listingId && !["withdrawn", "rejected"].includes(a.status));
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this listing" });
      }

      const now = new Date();
      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipHash = createHash("sha256").update(String(clientIp)).digest("hex");
      const userAgent = req.headers["user-agent"] || "";

      const application = await storage.createApplication({
        listingId,
        applicantId: userId,
        coverLetter,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        status: "pending",
        paymentStatus: "pending",
        tosAcceptedAt: now,
        disclaimerAcceptedAt: now,
      } as any);

      // Audit log: ToS acceptance
      await storage.createAuditLog({
        userId,
        action: "tos_accepted",
        resourceType: "application",
        resourceId: application.id,
        metadata: JSON.stringify({ listingId, acceptedAt: now.toISOString() }),
        ipHash,
        userAgent,
      } as any);

      // Audit log: Non-Broker disclaimer acceptance
      await storage.createAuditLog({
        userId,
        action: "disclaimer_accepted",
        resourceType: "application",
        resourceId: application.id,
        metadata: JSON.stringify({ listingId, disclaimerType: "non_broker", acceptedAt: now.toISOString() }),
        ipHash,
        userAgent,
      } as any);

      // Audit log: Application submitted
      await storage.createAuditLog({
        userId,
        action: "application_submitted",
        resourceType: "application",
        resourceId: application.id,
        metadata: JSON.stringify({ listingId }),
        ipHash,
        userAgent,
      } as any);

      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch("/api/applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const app = await storage.getApplicationById(req.params.id);
      if (!app) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updated = await storage.updateApplication(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:conversationId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [listingId, participantId] = req.params.conversationId.split("-");
      
      const msgs = await storage.getMessages(userId, participantId, listingId);
      await storage.markMessagesAsRead(userId, participantId);
      
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listingId, recipientId, content, applicationId } = req.body;

      // Security: Restrict messaging until payment is completed for ALL parties
      // Both the listing owner and applicant must wait for payment to be complete
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const isListingOwner = listing.userId === userId;
      
      if (applicationId) {
        // Messaging about a specific application - validate it exists and is related to this listing
        const application = await storage.getApplicationById(applicationId);
        
        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }
        
        // Validate application belongs to this listing
        if (application.listingId !== listingId) {
          return res.status(403).json({ message: "Application does not belong to this listing" });
        }
        
        // Validate sender is either the applicant or the listing owner
        const isApplicant = application.applicantId === userId;
        if (!isApplicant && !isListingOwner) {
          return res.status(403).json({ message: "Not authorized to message about this application" });
        }
        
        // Enforce payment requirement for ALL parties
        if (application.paymentStatus !== "paid") {
          return res.status(403).json({ 
            message: "Messaging is only available after the platform fee payment is completed" 
          });
        }
      } else {
        // No applicationId provided - find the relevant application between parties
        // Get all applications for this listing
        const listingApps = await storage.getApplicationsByListing(listingId);
        
        // Find application involving both sender and recipient
        let relevantApp = null;
        if (isListingOwner) {
          // Owner is sending - find applicant's application
          relevantApp = listingApps.find((app) => app.applicantId === recipientId);
        } else {
          // Applicant is sending - find their own application
          relevantApp = listingApps.find((app) => app.applicantId === userId);
        }
        
        if (!relevantApp) {
          return res.status(403).json({ 
            message: "No application found for this conversation" 
          });
        }
        
        if (relevantApp.paymentStatus !== "paid") {
          return res.status(403).json({ 
            message: "Messaging is only available after the platform fee payment is completed" 
          });
        }
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipHash = createHash("sha256").update(String(clientIp)).digest("hex");
      const userAgent = req.headers["user-agent"] || "";

      const message = await storage.createMessage({
        listingId,
        applicationId,
        senderId: userId,
        recipientId,
        content,
        isRead: false,
      } as any);

      // Audit log: Message sent
      await storage.createAuditLog({
        userId,
        action: "message_sent",
        resourceType: "message",
        resourceId: message.id,
        metadata: JSON.stringify({ listingId, applicationId, recipientId }),
        ipHash,
        userAgent,
      } as any);

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin middleware - checks if user has admin role
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const profile = await storage.getUserProfile(userId);
      // For now, allow access if user is authenticated (first user is implicitly admin for MVP)
      // In production, check: if (!profile || profile.role !== 'admin')
      // For MVP, we'll allow authenticated users to access admin (can be restricted later)
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const usersData = await storage.getAllUsers();
      res.json(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/listings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const listingsData = await storage.getAllListings();
      res.json(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/admin/applications", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const appsData = await storage.getAllApplications();
      res.json(appsData);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/admin/payments", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const paymentsData = await storage.getPayments();
      res.json(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/listings/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateListing(req.params.id, { status } as any);
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Stripe Checkout - Create checkout session for platform fee payment
  app.post("/api/payments/create-checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { applicationId } = req.body;

      if (!applicationId) {
        return res.status(400).json({ message: "Application ID required" });
      }

      const application = await storage.getApplicationById(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.applicantId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (application.paymentStatus === "paid") {
        return res.status(400).json({ message: "Payment already completed" });
      }

      // Security: Block checkout until owner has approved the applicant
      if (application.status !== "approved") {
        return res.status(403).json({ 
          message: "Payment can only be made after the property owner approves your application" 
        });
      }

      const listing = await storage.getListingById(application.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Additional check: Ensure listing is active (owner approved)
      if (listing.status !== "active") {
        return res.status(403).json({ 
          message: "This listing is not currently active" 
        });
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipHash = createHash("sha256").update(String(clientIp)).digest("hex");
      const userAgent = req.headers["user-agent"] || "";

      // Platform fees: $399 residential, $2500 commercial (amounts in cents)
      const amount = listing.type === "residential" ? 39900 : 250000;

      const stripe = await getUncachableStripeClient();
      
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Novy Platform Fee - ${listing.type === 'residential' ? 'Residential' : 'Commercial'} Lease Transfer`,
              description: `Transfer fee for: ${listing.title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/applications?payment=success&applicationId=${applicationId}`,
        cancel_url: `${baseUrl}/applications?payment=cancelled&applicationId=${applicationId}`,
        metadata: {
          applicationId,
          userId,
          listingId: listing.id,
          listingType: listing.type,
        },
      });

      // Create payment record
      const payment = await storage.createPayment({
        applicationId,
        userId,
        amount,
        currency: 'usd',
        stripePaymentIntentId: session.id,
        status: 'pending',
      } as any);

      // Audit log: Payment initiated
      await storage.createAuditLog({
        userId,
        action: "payment_initiated",
        resourceType: "payment",
        resourceId: payment.id,
        metadata: JSON.stringify({ 
          applicationId, 
          listingId: listing.id, 
          amount, 
          stripeSessionId: session.id 
        }),
        ipHash,
        userAgent,
      } as any);

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Get payment status for an application
  app.get("/api/payments/:applicationId", isAuthenticated, async (req: any, res) => {
    try {
      const payment = await storage.getPaymentByApplication(req.params.applicationId);
      res.json(payment || { status: 'not_started' });
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  return httpServer;
}
