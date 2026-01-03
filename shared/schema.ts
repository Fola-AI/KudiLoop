import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groupFrequencyEnum = pgEnum('group_frequency', ['weekly', 'monthly']);
export const groupStatusEnum = pgEnum('group_status', ['pending', 'active', 'completed']);
export const groupVisibilityEnum = pgEnum('group_visibility', ['open', 'closed']);
export const payoutMediumEnum = pgEnum('payout_medium', ['admin', 'cycle_receiver']);
export const currencyEnum = pgEnum('currency', ['NGN', 'GBP', 'EUR', 'USD', 'CAD']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'inactive']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'overdue']);
export const memberRoleEnum = pgEnum('member_role', ['creator', 'participant']);
export const messageTypeEnum = pgEnum('message_type', ['direct', 'group', 'inbox']);
export const joinRequestStatusEnum = pgEnum('join_request_status', ['pending', 'approved', 'rejected']);
export const userStatusEnum = pgEnum('user_status', ['active', 'restricted', 'banned', 'deleted']);
export const auditActionEnum = pgEnum('audit_action', ['user_created', 'user_updated', 'user_deleted', 'user_banned', 'user_unbanned', 'user_restricted', 'profile_edited', 'status_changed', 'sql_query_executed', 'group_deleted', 'create_partner', 'update_partner', 'delete_partner', 'upload_partner_logo']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'prefer_not_to_say']);
export const potTransactionTypeEnum = pgEnum('pot_transaction_type', ['deposit', 'withdrawal']);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  clerkUserId: varchar("clerk_user_id").unique(),
  passwordHash: varchar("password_hash"),
  authProvider: varchar("auth_provider"),
  authProviderId: varchar("auth_provider_id"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  preferredName: varchar("preferred_name"),
  profileImageUrl: varchar("profile_image_url"),
  avatarChoice: varchar("avatar_choice"),
  gender: genderEnum("gender"),
  phone: varchar("phone"),
  aboutMe: text("about_me"),
  isAdmin: integer("is_admin").notNull().default(0),
  status: userStatusEnum("status").notNull().default('active'),
  deletedAt: timestamp("deleted_at"),
  restrictedUntil: timestamp("restricted_until"),
  deletionCount: integer("deletion_count").notNull().default(0),
  localBankAccountName: varchar("local_bank_account_name"),
  localBankAccountNumber: varchar("local_bank_account_number"),
  localBankName: varchar("local_bank_name"),
  localBankSortCode: varchar("local_bank_sort_code"),
  internationalBankAccountName: varchar("international_bank_account_name"),
  internationalBankAccountNumber: varchar("international_bank_account_number"),
  internationalBankSwiftCode: varchar("international_bank_swift_code"),
  internationalBankIBAN: varchar("international_bank_iban"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  totalFundsNGN: decimal("total_funds_ngn", { precision: 15, scale: 2 }).notNull().default('0'),
  totalFundsGBP: decimal("total_funds_gbp", { precision: 15, scale: 2 }).notNull().default('0'),
  totalFundsUSD: decimal("total_funds_usd", { precision: 15, scale: 2 }).notNull().default('0'),
  totalFundsEUR: decimal("total_funds_eur", { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_status").on(table.status),
  index("idx_users_created").on(table.createdAt),
  index("idx_users_email").on(table.email),
]);

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  contributionAmount: integer("contribution_amount").notNull(),
  currency: currencyEnum("currency").notNull().default('NGN'),
  frequency: groupFrequencyEnum("frequency").notNull(),
  status: groupStatusEnum("status").notNull().default('pending'),
  visibility: groupVisibilityEnum("visibility").notNull().default('closed'),
  maxMembers: integer("max_members"),
  payoutMedium: payoutMediumEnum("payout_medium").notNull().default('cycle_receiver'),
  currentCycle: integer("current_cycle").notNull().default(1),
  totalCycles: integer("total_cycles").notNull(),
  nextCollectionDate: text("next_collection_date").notNull(),
  startDate: text("start_date").notNull(),
  goLiveDate: timestamp("go_live_date").notNull(),
  adjustedGoLiveDate: timestamp("adjusted_go_live_date"),
  isLive: integer("is_live").notNull().default(0),
  scheduleVisibility: integer("schedule_visibility").notNull().default(1),
  recipientVisibility: integer("recipient_visibility").notNull().default(1),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_groups_status").on(table.status),
  index("idx_groups_currency").on(table.currency),
  index("idx_groups_frequency").on(table.frequency),
  index("idx_groups_created").on(table.createdAt),
]);

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
  joinDate: text("join_date").notNull(),
  status: memberStatusEnum("status").notNull().default('active'),
  role: memberRoleEnum("role").notNull().default('participant'),
  isAdmin: integer("is_admin").notNull().default(0),
  canPostInGroup: integer("can_post_in_group").notNull().default(1),
  rotationOrder: integer("rotation_order").notNull(),
});

export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  cycle: integer("cycle").notNull(),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  datePaid: text("date_paid"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inviteLinks = pgTable("invite_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  token: varchar("token").notNull().unique(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: 'cascade' }),
  type: messageTypeEnum("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_messages_group_created").on(table.groupId, table.createdAt),
  index("idx_messages_recipient_created").on(table.recipientId, table.createdAt),
]);

export const joinRequests = pgTable("join_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: joinRequestStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_join_requests_group").on(table.groupId, table.status),
  index("idx_join_requests_user").on(table.userId, table.status),
]);

export const auditEvents = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: 'cascade' }),
  action: auditActionEnum("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_events_actor").on(table.actorId, table.createdAt),
  index("idx_audit_events_target").on(table.targetUserId, table.createdAt),
  index("idx_audit_events_action").on(table.action, table.createdAt),
]);

export const paymentReceipts = pgTable("payment_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: varchar("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  cycleNumber: integer("cycle_number").notNull(),
  receiptUrl: text("receipt_url").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_receipts_group_cycle").on(table.groupId, table.cycleNumber),
  index("idx_receipts_member").on(table.memberId),
]);

export const savingsPots = pgTable("savings_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  balanceNGN: decimal("balance_ngn", { precision: 15, scale: 2 }).notNull().default('0'),
  balanceGBP: decimal("balance_gbp", { precision: 15, scale: 2 }).notNull().default('0'),
  balanceUSD: decimal("balance_usd", { precision: 15, scale: 2 }).notNull().default('0'),
  balanceEUR: decimal("balance_eur", { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pots_user").on(table.userId),
]);

export const potTransactions = pgTable("pot_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  potId: varchar("pot_id").notNull().references(() => savingsPots.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  type: potTransactionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pot_transactions_pot").on(table.potId, table.createdAt),
  index("idx_pot_transactions_user").on(table.userId, table.createdAt),
]);

// Insert schemas
export const insertGroupSchema = createInsertSchema(groups, {
  goLiveDate: z.union([z.date(), z.string()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  totalCycles: z.number().int().min(3, 'Minimum 3 cycles required for a group'),
}).omit({
  id: true,
  createdAt: true,
  userId: true,
}).required({
  goLiveDate: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

// Separate DTO schema for invite links - built from scratch to enforce ISO strings
export const createInviteLinkDTOSchema = z.object({
  groupId: z.string(),
  token: z.string(),
  createdBy: z.string(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
});

// Keep the Drizzle insert schema for internal database operations only
export const insertInviteLinkSchema = createInsertSchema(inviteLinks).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  recipientId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
});

export const insertJoinRequestSchema = createInsertSchema(joinRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentReceiptSchema = createInsertSchema(paymentReceipts).omit({
  id: true,
  uploadedAt: true,
});

export const insertSavingsPotSchema = createInsertSchema(savingsPots).omit({
  id: true,
  createdAt: true,
});

export const insertPotTransactionSchema = createInsertSchema(potTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
// Server-side type for creating groups with userId
export type GroupCreateInput = InsertGroup & { userId: string };

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect & {
  displayName?: string;
  preferredName?: string | null;
};

export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

// Invite link types
// API DTO type with validated string dates (derived from scratch-built schema)
export type CreateInviteLinkDTO = z.infer<typeof createInviteLinkDTOSchema>;
// Storage type with Date objects (internal use only)
export type InsertInviteLink = typeof inviteLinks.$inferInsert;
export type InviteLink = typeof inviteLinks.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type JoinRequest = typeof joinRequests.$inferSelect;

export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;

export type InsertPaymentReceipt = z.infer<typeof insertPaymentReceiptSchema>;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;

export type InsertSavingsPot = z.infer<typeof insertSavingsPotSchema>;
export type SavingsPot = typeof savingsPots.$inferSelect;

export type InsertPotTransaction = z.infer<typeof insertPotTransactionSchema>;
export type PotTransaction = typeof potTransactions.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Schema for updating user profile (excludes id, email, createdAt, updatedAt, profileImageUrl)
// All fields are optional to allow partial updates. Frontend enforces required fields.
export const updateUserProfileSchema = z.object({
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  preferredName: z.string().max(100),
  gender: z.enum(['male', 'female', 'prefer_not_to_say']).nullable(),
  avatarChoice: z.string().max(50).nullable(),
  profileImageUrl: z.string().max(500).nullable(),
  phone: z.string().max(20).regex(/^[\d\s\+\-\(\)]*$/),
  aboutMe: z.string().max(1000),
  localBankAccountName: z.string().max(200),
  localBankAccountNumber: z.string().max(50).regex(/^[\d\s\-]*$/),
  localBankName: z.string().max(200),
  localBankSortCode: z.string().max(20).regex(/^[\d\s\-]*$/),
  internationalBankAccountName: z.string().max(200),
  internationalBankAccountNumber: z.string().max(50).regex(/^[\d\s\-]*$/),
  // Case-insensitive regex - frontend will normalize to uppercase before submission
  internationalBankSwiftCode: z.string().max(11).regex(/^[A-Za-z0-9]*$/),
  internationalBankIBAN: z.string().max(34).regex(/^[A-Za-z0-9\s]*$/),
}).partial();

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

// Helper to check if a user has completed required profile fields
export function isProfileComplete(user: User | undefined): boolean {
  if (!user) return false;
  return !!(
    user.firstName && 
    user.firstName.trim().length > 0 &&
    user.lastName && 
    user.lastName.trim().length > 0 &&
    user.phone && 
    user.phone.trim().length > 0 &&
    user.email &&
    user.email.trim().length > 0
  );
}

// ============================================================================
// Affiliate Partner Tables
// ============================================================================

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  affiliateLink: text("affiliate_link").notNull(),
  commissionRate: varchar("commission_rate", { length: 100 }),
  logoUrl: text("logo_url"),
  color: varchar("color", { length: 50 }).notNull().default('from-blue-500 to-cyan-500'),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_partners_active").on(table.isActive),
  index("idx_partners_category").on(table.category),
]);

export const partnerClicks = pgTable("partner_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
}, (table) => [
  index("idx_partner_clicks_partner").on(table.partnerId),
  index("idx_partner_clicks_user").on(table.userId),
  index("idx_partner_clicks_date").on(table.clickedAt),
]);

// Type exports for partners
export type Partner = typeof partners.$inferSelect;
export type PartnerClick = typeof partnerClicks.$inferSelect;

// Insert schemas for partners
export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;

export const insertPartnerClickSchema = createInsertSchema(partnerClicks).omit({
  id: true,
  clickedAt: true,
});

export type InsertPartnerClick = z.infer<typeof insertPartnerClickSchema>;

// ============================================================================
// Device Tokens for Push Notifications
// ============================================================================

export const devicePlatformEnum = pgEnum('device_platform', ['ios', 'android', 'web']);

export const deviceTokens = pgTable("device_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull(),
  platform: devicePlatformEnum("platform").notNull(),
  deviceName: varchar("device_name", { length: 200 }),
  isActive: integer("is_active").notNull().default(1),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_device_tokens_user").on(table.userId),
  index("idx_device_tokens_token").on(table.token),
  index("idx_device_tokens_active").on(table.isActive),
]);

export type DeviceToken = typeof deviceTokens.$inferSelect;

export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;

// ============================================================================
// User Settings (Preferences stored server-side)
// ============================================================================

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  theme: varchar("theme", { length: 20 }).notNull().default('light'),
  inactivityTimeoutEnabled: integer("inactivity_timeout_enabled").notNull().default(1),
  inactivityTimeoutMinutes: integer("inactivity_timeout_minutes").notNull().default(3),
  biometricEnabled: integer("biometric_enabled").notNull().default(0),
  pushNotificationsEnabled: integer("push_notifications_enabled").notNull().default(1),
  emailNotificationsEnabled: integer("email_notifications_enabled").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_settings_user").on(table.userId),
]);

export type UserSettings = typeof userSettings.$inferSelect;

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export const updateUserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  inactivityTimeoutEnabled: z.boolean().optional(),
  inactivityTimeoutMinutes: z.number().int().min(1).max(60).optional(),
  biometricEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

// ============================================================================
// Data Exports (Track user data export requests)
// ============================================================================

export const exportStatusEnum = pgEnum('export_status', ['pending', 'processing', 'completed', 'failed']);
export const exportTypeEnum = pgEnum('export_type', ['contributions', 'groups', 'all']);

export const dataExports = pgTable("data_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  exportType: exportTypeEnum("export_type").notNull(),
  status: exportStatusEnum("status").notNull().default('pending'),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  expiresAt: timestamp("expires_at"),
  errorMessage: text("error_message"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_data_exports_user").on(table.userId),
  index("idx_data_exports_status").on(table.status),
]);

export type DataExport = typeof dataExports.$inferSelect;

export const insertDataExportSchema = createInsertSchema(dataExports).omit({
  id: true,
  requestedAt: true,
  completedAt: true,
});

export type InsertDataExport = z.infer<typeof insertDataExportSchema>;

// ============================================================================
// Notification Log (Track all notifications sent)
// ============================================================================

export const notificationTypeEnum = pgEnum('notification_type', [
  'contribution_reminder',
  'contribution_received',
  'payout_upcoming',
  'payout_received',
  'group_invitation',
  'group_joined',
  'cycle_advanced',
  'message_received',
  'system_announcement'
]);

export const notificationChannelEnum = pgEnum('notification_channel', ['push', 'email', 'in_app']);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  isRead: integer("is_read").notNull().default(0),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_type").on(table.type),
  index("idx_notifications_read").on(table.isRead),
  index("idx_notifications_sent").on(table.sentAt),
]);

export type Notification = typeof notifications.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
  readAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
