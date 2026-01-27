import {
  userProfiles,
  listings,
  applications,
  documents,
  messages,
  ownerAuthorizations,
  payments,
  type UserProfile,
  type InsertUserProfile,
  type Listing,
  type InsertListing,
  type Application,
  type InsertApplication,
  type Document,
  type InsertDocument,
  type Message,
  type InsertMessage,
  type OwnerAuthorization,
  type InsertOwnerAuthorization,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, or, desc, sql, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  getListings(status?: string): Promise<Listing[]>;
  getListingById(id: string): Promise<Listing | undefined>;
  getListingsByUser(userId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<void>;

  getOwnerAuthorization(id: string): Promise<OwnerAuthorization | undefined>;
  getOwnerAuthorizationByToken(token: string): Promise<OwnerAuthorization | undefined>;
  getOwnerAuthorizationByListing(listingId: string): Promise<OwnerAuthorization | undefined>;
  createOwnerAuthorization(auth: InsertOwnerAuthorization): Promise<OwnerAuthorization>;
  updateOwnerAuthorization(id: string, auth: Partial<InsertOwnerAuthorization & { status: string; approvedAt?: Date; rejectedAt?: Date; ipHash?: string }>): Promise<OwnerAuthorization | undefined>;

  getApplications(): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | undefined>;
  getApplicationsByUser(userId: string): Promise<Application[]>;
  getApplicationsByListing(listingId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, application: Partial<InsertApplication & { status: string; paymentStatus?: string }>): Promise<Application | undefined>;

  getDocuments(userId: string): Promise<Document[]>;
  getDocumentsByApplication(applicationId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  getConversations(userId: string): Promise<any[]>;
  getMessages(userId: string, participantId: string, listingId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;

  getPayments(): Promise<Payment[]>;
  getPaymentByApplication(applicationId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment & { status: string; completedAt?: Date }>): Promise<Payment | undefined>;

  getAllUsers(): Promise<User[]>;
  getAllListings(): Promise<Listing[]>;
  getAllApplications(): Promise<Application[]>;
  getStats(): Promise<{ totalUsers: number; totalListings: number; activeListings: number; totalApplications: number; totalPayments: number; revenue: number }>;
  getDashboardStats(userId: string): Promise<{ totalListings: number; pendingApplications: number; unreadMessages: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getListings(status?: string): Promise<Listing[]> {
    if (status) {
      return db.select().from(listings).where(eq(listings.status, status as any)).orderBy(desc(listings.createdAt));
    }
    return db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getListingById(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListingsByUser(userId: string): Promise<Listing[]> {
    return db.select().from(listings).where(eq(listings.userId, userId)).orderBy(desc(listings.createdAt));
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [created] = await db.insert(listings).values(listing).returning();
    return created;
  }

  async updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing | undefined> {
    const [updated] = await db
      .update(listings)
      .set({ ...listing, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async getOwnerAuthorization(id: string): Promise<OwnerAuthorization | undefined> {
    const [auth] = await db.select().from(ownerAuthorizations).where(eq(ownerAuthorizations.id, id));
    return auth;
  }

  async getOwnerAuthorizationByToken(token: string): Promise<OwnerAuthorization | undefined> {
    const [auth] = await db.select().from(ownerAuthorizations).where(eq(ownerAuthorizations.token, token));
    return auth;
  }

  async getOwnerAuthorizationByListing(listingId: string): Promise<OwnerAuthorization | undefined> {
    const [auth] = await db.select().from(ownerAuthorizations).where(eq(ownerAuthorizations.listingId, listingId));
    return auth;
  }

  async createOwnerAuthorization(auth: InsertOwnerAuthorization): Promise<OwnerAuthorization> {
    const [created] = await db.insert(ownerAuthorizations).values(auth).returning();
    return created;
  }

  async updateOwnerAuthorization(id: string, auth: Partial<InsertOwnerAuthorization & { status: string; approvedAt?: Date; rejectedAt?: Date; ipHash?: string }>): Promise<OwnerAuthorization | undefined> {
    const [updated] = await db
      .update(ownerAuthorizations)
      .set(auth)
      .where(eq(ownerAuthorizations.id, id))
      .returning();
    return updated;
  }

  async getApplications(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async getApplicationsByUser(userId: string): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.applicantId, userId)).orderBy(desc(applications.createdAt));
  }

  async getApplicationsByListing(listingId: string): Promise<Application[]> {
    return db.select().from(applications).where(eq(applications.listingId, listingId)).orderBy(desc(applications.createdAt));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await db.insert(applications).values(application).returning();
    return created;
  }

  async updateApplication(id: string, application: Partial<InsertApplication & { status: string; paymentStatus?: string }>): Promise<Application | undefined> {
    const [updated] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByApplication(applicationId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.applicationId, applicationId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async getConversations(userId: string): Promise<any[]> {
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationsMap = new Map();
    
    for (const msg of userMessages) {
      const participantId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const key = `${msg.listingId}-${participantId}`;
      
      if (!conversationsMap.has(key)) {
        const listing = await this.getListingById(msg.listingId);
        const unreadCount = userMessages.filter(
          (m) => m.senderId === participantId && m.recipientId === userId && !m.isRead
        ).length;

        conversationsMap.set(key, {
          id: key,
          participantId,
          participantName: "User",
          listingId: msg.listingId,
          listingTitle: listing?.title || "Unknown Listing",
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount,
        });
      }
    }

    return Array.from(conversationsMap.values());
  }

  async getMessages(userId: string, participantId: string, listingId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.listingId, listingId),
          or(
            and(eq(messages.senderId, userId), eq(messages.recipientId, participantId)),
            and(eq(messages.senderId, participantId), eq(messages.recipientId, userId))
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.recipientId, userId), eq(messages.senderId, senderId)));
  }

  async getPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentByApplication(applicationId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.applicationId, applicationId));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment & { status: string; completedAt?: Date }>): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllListings(): Promise<Listing[]> {
    return db.select().from(listings).orderBy(desc(listings.createdAt));
  }

  async getAllApplications(): Promise<Application[]> {
    return db.select().from(applications).orderBy(desc(applications.createdAt));
  }

  async getStats(): Promise<{ totalUsers: number; totalListings: number; activeListings: number; totalApplications: number; totalPayments: number; revenue: number }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [listingCount] = await db.select({ count: count() }).from(listings);
    const [activeListingCount] = await db.select({ count: count() }).from(listings).where(eq(listings.status, "active"));
    const [applicationCount] = await db.select({ count: count() }).from(applications);
    const [paymentCount] = await db.select({ count: count() }).from(payments).where(eq(payments.status, "completed"));
    const [revenueResult] = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "completed"));

    return {
      totalUsers: userCount.count,
      totalListings: listingCount.count,
      activeListings: activeListingCount.count,
      totalApplications: applicationCount.count,
      totalPayments: paymentCount.count,
      revenue: revenueResult.sum || 0,
    };
  }

  async getDashboardStats(userId: string): Promise<{ totalListings: number; pendingApplications: number; unreadMessages: number }> {
    const userListings = await this.getListingsByUser(userId);
    const listingIds = userListings.map((l) => l.id);
    
    let pendingApplications = 0;
    for (const listingId of listingIds) {
      const apps = await db
        .select({ count: count() })
        .from(applications)
        .where(and(eq(applications.listingId, listingId), eq(applications.status, "pending")));
      pendingApplications += apps[0].count;
    }

    const [unreadCount] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.recipientId, userId), eq(messages.isRead, false)));

    return {
      totalListings: userListings.filter((l) => l.status === "active").length,
      pendingApplications,
      unreadMessages: unreadCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
