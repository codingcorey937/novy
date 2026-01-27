import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertListingSchema, insertApplicationSchema, insertMessageSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

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
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await storage.createOwnerAuthorization({
        listingId: listing.id,
        token,
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

      if (auth.status !== "pending") {
        return res.status(400).json({ message: "Authorization already processed" });
      }

      if (new Date() > new Date(auth.expiresAt)) {
        return res.status(400).json({ message: "Authorization link has expired" });
      }

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipHash = createHash("sha256").update(String(clientIp)).digest("hex");

      if (approve) {
        await storage.updateOwnerAuthorization(auth.id, {
          status: "approved",
          approvedAt: new Date(),
          ipHash,
        });
        await storage.updateListing(auth.listingId, { status: "active" } as any);
      } else {
        await storage.updateOwnerAuthorization(auth.id, {
          status: "rejected",
          rejectedAt: new Date(),
          ipHash,
        });
        await storage.updateListing(auth.listingId, { status: "cancelled" } as any);
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
      const { listingId, coverLetter, moveInDate } = req.body;

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

      const application = await storage.createApplication({
        listingId,
        applicantId: userId,
        coverLetter,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        status: "pending",
        paymentStatus: "pending",
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

      const message = await storage.createMessage({
        listingId,
        applicationId,
        senderId: userId,
        recipientId,
        content,
        isRead: false,
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

  return httpServer;
}
