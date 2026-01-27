import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const userRoleEnum = pgEnum("user_role", ["tenant", "owner", "admin"]);
export const listingStatusEnum = pgEnum("listing_status", ["draft", "pending_authorization", "active", "transferred", "expired", "cancelled"]);
export const listingTypeEnum = pgEnum("listing_type", ["residential", "commercial"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "under_review", "approved", "rejected", "withdrawn"]);
export const documentTypeEnum = pgEnum("document_type", ["lease", "id", "income_proof", "authorization", "other"]);

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  role: userRoleEnum("role").notNull().default("tenant"),
  phone: varchar("phone"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),
  type: listingTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  address: varchar("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  rent: integer("rent").notNull(),
  leaseExpiration: timestamp("lease_expiration").notNull(),
  allowedUse: text("allowed_use"),
  squareFootage: integer("square_footage"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  description: text("description"),
  amenities: text("amenities"),
  ownerEmail: varchar("owner_email").notNull(),
  ownerName: varchar("owner_name"),
  leaseDocumentId: varchar("lease_document_id"),
  imageUrls: text("image_urls"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ownerAuthorizations = pgTable("owner_authorizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  tokenHash: varchar("token_hash").notNull().unique(),
  ownerEmail: varchar("owner_email").notNull(),
  status: varchar("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  ipHash: varchar("ip_hash"),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  applicantId: varchar("applicant_id").notNull(),
  status: applicationStatusEnum("status").notNull().default("pending"),
  coverLetter: text("cover_letter"),
  moveInDate: timestamp("move_in_date"),
  paymentStatus: varchar("payment_status").default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  applicationId: varchar("application_id"),
  listingId: varchar("listing_id"),
  type: documentTypeEnum("type").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull(),
  applicationId: varchar("application_id"),
  senderId: varchar("sender_id").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  userId: varchar("user_id").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency").notNull().default("usd"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeChargeId: varchar("stripe_charge_id"),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const auditLogActionEnum = pgEnum("audit_log_action", [
  "owner_approval",
  "owner_rejection", 
  "payment_initiated",
  "payment_completed",
  "payment_failed",
  "tos_accepted",
  "disclaimer_accepted",
  "message_sent",
  "application_submitted"
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  action: auditLogActionEnum("action").notNull(),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  metadata: text("metadata"),
  ipHash: varchar("ip_hash"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const listingsRelations = relations(listings, ({ one, many }) => ({
  ownerAuthorization: one(ownerAuthorizations, {
    fields: [listings.id],
    references: [ownerAuthorizations.listingId],
  }),
  applications: many(applications),
  documents: many(documents),
  messages: many(messages),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  listing: one(listings, {
    fields: [applications.listingId],
    references: [listings.id],
  }),
  documents: many(documents),
  messages: many(messages),
}));

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertOwnerAuthorizationSchema = createInsertSchema(ownerAuthorizations).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type OwnerAuthorization = typeof ownerAuthorizations.$inferSelect;
export type InsertOwnerAuthorization = z.infer<typeof insertOwnerAuthorizationSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
