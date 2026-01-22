import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import type { 
  InsertGroup, 
  Group,
  GroupCreateInput,
  InsertMember, 
  Member, 
  InsertContribution, 
  Contribution,
  UpsertUser,
  User,
  UpdateUserProfileInput,
  CreateInviteLinkDTO,
  InviteLink,
  InsertMessage,
  Message,
  InsertJoinRequest,
  JoinRequest
} from "@shared/schema";
import * as fs from "node:fs";
import * as path from "node:path";

// Create PostgreSQL connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

// Result type for cycle advancement
export interface CycleAdvanceResult {
  advanced: boolean;
  reason: string;
  previousCycle?: number;
  newCycle?: number;
  groupCompleted?: boolean;
  missingContributions?: number;
  unpaidContributions?: number;
  totalMembers?: number;
  totalContributions?: number;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByClerkId(clerkUserId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: UpdateUserProfileInput): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Groups
  createGroup(group: GroupCreateInput): Promise<Group>;
  getGroup(id: string, userId?: string): Promise<Group | undefined>;
  getAllGroups(userId?: string): Promise<Group[]>;
  getActiveGroups(): Promise<Group[]>;
  updateGroup(id: string, updates: Partial<InsertGroup>, userId?: string): Promise<Group | undefined>;
  
  // Members
  createMember(member: InsertMember): Promise<Member>;
  getMember(id: string): Promise<Member | undefined>;
  getMembersByGroup(groupId: string): Promise<Member[]>;
  getMemberByUserAndGroup(userId: string, groupId: string): Promise<Member | undefined>;
  updateMemberPermissions(id: string, canPostInGroup: boolean): Promise<Member | undefined>;
  updateMemberAdminStatus(id: string, isAdmin: boolean): Promise<Member | undefined>;
  updateMemberRotationOrder(id: string, rotationOrder: number): Promise<Member | undefined>;
  deleteMember(id: string, groupId: string): Promise<boolean>;
  
  // Contributions
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContribution(id: string): Promise<Contribution | undefined>;
  getContributionsByGroupAndCycle(groupId: string, cycle: number): Promise<Contribution[]>;
  getContributionsByGroup(groupId: string): Promise<Contribution[]>;
  getContributionByMemberAndCycle(memberId: string, cycle: number): Promise<Contribution | undefined>;
  updateContributionStatus(
    id: string, 
    status: 'paid' | 'pending' | 'overdue', 
    datePaid?: string | null
  ): Promise<Contribution | undefined>;
  updateContributionReceipt(id: string, receiptUrl: string | null): Promise<Contribution | undefined>;
  checkAndAdvanceCycle(groupId: string, cycle: number): Promise<CycleAdvanceResult>;
  
  // Invite Links
  createInviteLink(inviteLink: CreateInviteLinkDTO): Promise<InviteLink>;
  getInviteLink(token: string): Promise<InviteLink | undefined>;
  getInviteLinksByGroup(groupId: string): Promise<InviteLink[]>;
  incrementInviteLinkUsage(token: string): Promise<InviteLink | undefined>;
  deleteInviteLink(id: string, groupId: string): Promise<boolean>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getDirectMessages(groupId: string, userId: string): Promise<Message[]>;
  getGroupMessages(groupId: string): Promise<Message[]>;
  getInboxMessages(userId: string): Promise<Message[]>;
  deleteMessage(id: string, senderId: string): Promise<boolean>;
  
  // Join Requests
  createJoinRequest(request: InsertJoinRequest): Promise<JoinRequest>;
  getJoinRequest(id: string): Promise<JoinRequest | undefined>;
  getJoinRequestsByGroup(groupId: string): Promise<JoinRequest[]>;
  getJoinRequestsByUser(userId: string): Promise<JoinRequest[]>;
  updateJoinRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<JoinRequest | undefined>;
  deleteJoinRequest(id: string): Promise<boolean>;
  
  // Open Groups
  getOpenGroups(userId?: string): Promise<Group[]>;
  searchGroups(query: string, userId?: string): Promise<Group[]>;
  
  // Group Access Verification
  isUserGroupMember(groupId: string, userId: string): Promise<boolean>;
  
  // Admin User Management
  updateUserStatus(userId: string, status: 'active' | 'restricted' | 'banned' | 'deleted', restrictedUntil?: Date | null): Promise<User | undefined>;
  adminUpdateUserProfile(userId: string, updates: Partial<UpdateUserProfileInput>): Promise<User | undefined>;
  getUserActivity(userId: string): Promise<{
    groupsCreated: number;
    groupsJoined: number;
    totalContributions: number;
    messages: number;
  }>;
  
  // Account Deletion (Apple App Store requirement)
  deleteUserAccount(userId: string): Promise<boolean>;
  
  // Audit Logging
  createAuditEvent(event: schema.InsertAuditEvent): Promise<schema.AuditEvent>;
  getAuditEvents(limit?: number): Promise<schema.AuditEvent[]>;
  getUserAuditEvents(userId: string, limit?: number): Promise<schema.AuditEvent[]>;
  
  // Admin Analytics
  getDashboardStats(): Promise<{
    userStats: {
      total: number;
      active: number;
      restricted: number;
      banned: number;
      deleted: number;
    };
    groupStats: {
      total: number;
      active: number;
      completed: number;
      pending: number;
      byCurrency: { currency: string; count: number }[];
      byFrequency: { frequency: string; count: number }[];
    };
    contributionStats: {
      totalByCurrency: { currency: string; total: number }[];
    };
  }>;
  
  // Payment Receipts
  createPaymentReceipt(receipt: schema.InsertPaymentReceipt): Promise<schema.PaymentReceipt>;
  getReceiptsByGroupCycle(groupId: string, cycleNumber: number): Promise<schema.PaymentReceipt[]>;
  getReceiptsByMember(memberId: string): Promise<schema.PaymentReceipt[]>;
  deleteReceiptsByCycle(groupId: string, cycleNumber: number): Promise<void>;
  
  // Savings Pots
  createSavingsPot(pot: schema.InsertSavingsPot): Promise<schema.SavingsPot>;
  getSavingsPotsByUser(userId: string): Promise<schema.SavingsPot[]>;
  getSavingsPot(id: string): Promise<schema.SavingsPot | undefined>;
  updatePotBalance(potId: string, balances: Partial<{
    balanceNGN: string;
    balanceGBP: string;
    balanceUSD: string;
    balanceEUR: string;
  }>): Promise<schema.SavingsPot | undefined>;
  deleteSavingsPot(id: string, userId: string): Promise<boolean>;
  
  // Pot Transactions
  createPotTransaction(transaction: schema.InsertPotTransaction): Promise<schema.PotTransaction>;
  getPotTransactions(potId: string): Promise<schema.PotTransaction[]>;
  
  // User Funds
  updateUserFunds(userId: string, funds: Partial<{
    totalFundsNGN: string;
    totalFundsGBP: string;
    totalFundsUSD: string;
    totalFundsEUR: string;
  }>): Promise<User | undefined>;
  
  // Affiliate Partners
  createPartner(partner: schema.InsertPartner): Promise<schema.Partner>;
  getPartners(activeOnly?: boolean): Promise<schema.Partner[]>;
  getPartner(id: string): Promise<schema.Partner | undefined>;
  updatePartner(id: string, updates: Partial<schema.InsertPartner>): Promise<schema.Partner | undefined>;
  deletePartner(id: string): Promise<boolean>;
  
  // Partner Click Tracking
  trackPartnerClick(partnerId: string, userId: string | null): Promise<schema.PartnerClick>;
  getPartnerAnalytics(partnerId?: string): Promise<{
    partnerId: string;
    partnerName: string;
    totalClicks: number;
    clicksThisMonth: number;
    clicksToday: number;
  }[]>;
  
  // Device Tokens (Push Notifications)
  registerDeviceToken(token: schema.InsertDeviceToken): Promise<schema.DeviceToken>;
  getDeviceTokensByUser(userId: string): Promise<schema.DeviceToken[]>;
  getUserDeviceTokens(userId: string): Promise<schema.DeviceToken[]>;
  updateDeviceTokenLastUsed(token: string): Promise<schema.DeviceToken | undefined>;
  deactivateDeviceToken(token: string): Promise<boolean>;
  
  // User Settings
  getUserSettings(userId: string): Promise<schema.UserSettings | undefined>;
  createUserSettings(settings: schema.InsertUserSettings): Promise<schema.UserSettings>;
  updateUserSettings(userId: string, updates: schema.UpdateUserSettings): Promise<schema.UserSettings | undefined>;
  
  // Data Exports
  createDataExport(exportRequest: schema.InsertDataExport): Promise<schema.DataExport>;
  getDataExportsByUser(userId: string): Promise<schema.DataExport[]>;
  updateDataExport(id: string, updates: Partial<schema.DataExport>): Promise<schema.DataExport | undefined>;
  getContributionHistoryForExport(userId: string): Promise<{
    groupName: string;
    memberName: string;
    cycle: number;
    amount: number;
    currency: string;
    status: string;
    datePaid: string | null;
    createdAt: Date;
  }[]>;
  
  // Notifications
  createNotification(notification: schema.InsertNotification): Promise<schema.Notification>;
  getNotificationsByUser(userId: string, limit?: number): Promise<schema.Notification[]>;
  markNotificationAsRead(id: string, userId: string): Promise<schema.Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DbStorage implements IStorage {
  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // CRITICAL: OIDC sub claim is the immutable stable identifier
    // Never update the ID - it would break all foreign key relationships
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: UpdateUserProfileInput): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(sql`${schema.users.createdAt} DESC`);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByClerkId(clerkUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.clerkUserId, clerkUserId));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(schema.users).values(userData as any).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  // Groups
  async createGroup(groupData: GroupCreateInput): Promise<Group> {
    const [group] = await db.insert(schema.groups).values(groupData).returning();
    return group;
  }

  async getGroup(id: string, userId?: string): Promise<Group | undefined> {
    // Always return group by ID - authorization handled at route level
    // userId parameter kept for backward compatibility but not used for filtering
    console.log("📦 storage.getGroup called with:", id);
    try {
      const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, id));
      console.log("📦 storage.getGroup result:", group ? "Found" : "Not found");
      return group;
    } catch (error) {
      console.error("📦 storage.getGroup ERROR:", error);
      throw error;
    }
  }

  async getAllGroups(userId?: string): Promise<Group[]> {
    // Filter out groups completed more than 1 week ago
    const oneWeekAgo = sql`NOW() - INTERVAL '7 days'`;
    
    if (userId) {
      // Get groups where user is creator OR member
      // First, get groups where user is creator
      let createdGroups: Group[] = [];
      try {
        createdGroups = await db
          .select()
          .from(schema.groups)
          .where(
            and(
              eq(schema.groups.userId, userId),
              or(
                sql`${schema.groups.completedAt} IS NULL`,
                sql`${schema.groups.completedAt} > ${oneWeekAgo}`
              )
            )
          );
      } catch (error) {
        console.error("📦 storage.getAllGroups ERROR (createdGroups):", error);
        throw error;
      }
      
      // Second, get groups where user is a member
      let memberGroupsResult: Group[] = [];
      try {
        memberGroupsResult = await db
          .select({
            id: schema.groups.id,
            userId: schema.groups.userId,
            name: schema.groups.name,
            contributionAmount: schema.groups.contributionAmount,
            currency: schema.groups.currency,
            frequency: schema.groups.frequency,
            totalCycles: schema.groups.totalCycles,
            currentCycle: schema.groups.currentCycle,
            goLiveDate: schema.groups.goLiveDate,
            adjustedGoLiveDate: schema.groups.adjustedGoLiveDate,
            status: schema.groups.status,
            visibility: schema.groups.visibility,
            maxMembers: schema.groups.maxMembers,
            payoutMedium: schema.groups.payoutMedium,
            nextCollectionDate: schema.groups.nextCollectionDate,
            startDate: schema.groups.startDate,
            isLive: schema.groups.isLive,
            completedAt: schema.groups.completedAt,
            createdAt: schema.groups.createdAt,
          })
          .from(schema.groups)
          .innerJoin(schema.members, eq(schema.groups.id, schema.members.groupId))
          .where(
            and(
              eq(schema.members.userId, userId),
              or(
                sql`${schema.groups.completedAt} IS NULL`,
                sql`${schema.groups.completedAt} > ${oneWeekAgo}`
              )
            )
          );
      } catch (error) {
        console.error("📦 storage.getAllGroups ERROR (memberGroupsResult):", error);
        throw error;
      }
      
      // Combine and deduplicate by group ID
      const allGroups = [...createdGroups, ...memberGroupsResult];
      const uniqueGroups = Array.from(
        new Map(allGroups.map(g => [g.id, g])).values()
      );
      
      return uniqueGroups;
    }
    
    try {
      return await db
        .select()
        .from(schema.groups)
        .where(
          or(
            sql`${schema.groups.completedAt} IS NULL`,
            sql`${schema.groups.completedAt} > ${oneWeekAgo}`
          )
        );
    } catch (error) {
      console.error("📦 storage.getAllGroups ERROR (no userId):", error);
      throw error;
    }
  }

  async getActiveGroups(): Promise<Group[]> {
    return await db
      .select()
      .from(schema.groups)
      .where(
        and(
          eq(schema.groups.status, "active"),
          eq(schema.groups.isLive, 1)
        )
      );
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>, userId?: string): Promise<Group | undefined> {
    const conditions = userId
      ? and(eq(schema.groups.id, id), eq(schema.groups.userId, userId))
      : eq(schema.groups.id, id);
    const [group] = await db
      .update(schema.groups)
      .set(updates)
      .where(conditions)
      .returning();
    return group;
  }

  async adjustCyclesToMemberCount(groupId: string): Promise<Group | undefined> {
    // Get current group and members
    const group = await this.getGroup(groupId);
    if (!group) return undefined;

    // Only adjust if group is live or about to go live (safety check)
    if (!group.isLive && new Date(group.goLiveDate) > new Date()) {
      return group; // Don't adjust if group hasn't reached go-live date yet
    }

    const members = await this.getMembersByGroup(groupId);
    const memberCount = members.length;

    // Validation: Ensure we have minimum required members (3) to adjust
    // If we don't, return the group unchanged
    if (memberCount < 3) {
      return group; // Can't go live with less than 3 members anyway
    }

    // Only adjust if member count is less than total cycles
    if (memberCount < group.totalCycles) {
      // Update totalCycles to match member count (which is >= 3)
      const [updatedGroup] = await db
        .update(schema.groups)
        .set({ totalCycles: memberCount })
        .where(eq(schema.groups.id, groupId))
        .returning();

      // Delete excess contribution records for cycles beyond member count
      // This ensures the rotation schedule matches the adjusted cycle count
      await db
        .delete(schema.contributions)
        .where(
          and(
            eq(schema.contributions.groupId, groupId),
            sql`${schema.contributions.cycle} > ${memberCount}`
          )
        );

      return updatedGroup;
    }

    return group;
  }

  // Members
  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(schema.members).values(insertMember).returning();
    return member;
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(schema.members).where(eq(schema.members.id, id));
    return member;
  }

  async getMembersByGroup(groupId: string): Promise<Member[]> {
    let results;
    try {
      results = await db
        .select({
          id: schema.members.id,
          groupId: schema.members.groupId,
          userId: schema.members.userId,
          name: schema.members.name,
          phone: schema.members.phone,
          avatar: schema.members.avatar,
          joinDate: schema.members.joinDate,
          status: schema.members.status,
          role: schema.members.role,
          isAdmin: schema.members.isAdmin,
          canPostInGroup: schema.members.canPostInGroup,
          rotationOrder: schema.members.rotationOrder,
          preferredName: schema.users.preferredName,
          userEmail: schema.users.email,
          userFirstName: schema.users.firstName,
          userLastName: schema.users.lastName,
          userProfileImageUrl: schema.users.profileImageUrl,
          userPhone: schema.users.phone,
          localBankName: schema.users.localBankName,
          localBankAccountNumber: schema.users.localBankAccountNumber,
          localBankAccountName: schema.users.localBankAccountName,
          internationalBankAccountNumber: schema.users.internationalBankAccountNumber,
          internationalBankAccountName: schema.users.internationalBankAccountName,
        })
        .from(schema.members)
        .leftJoin(schema.users, eq(schema.members.userId, schema.users.id))
        .where(eq(schema.members.groupId, groupId))
        .orderBy(schema.members.rotationOrder);
    } catch (error) {
      console.error("📦 storage.getMembersByGroup ERROR:", error);
      throw error;
    }

    // Map results to include displayName (preferredName if available, otherwise name)
    return results.map(result => {
      const user = result.userId ? {
        id: result.userId,
        email: result.userEmail,
        firstName: result.userFirstName,
        lastName: result.userLastName,
        profileImageUrl: result.userProfileImageUrl,
        phone: result.userPhone,
        localBankName: result.localBankName,
        localBankAccountNumber: result.localBankAccountNumber,
        localBankAccountName: result.localBankAccountName,
        internationalBankAccountNumber: result.internationalBankAccountNumber,
        internationalBankAccountName: result.internationalBankAccountName,
      } : undefined;

      return {
        id: result.id,
        groupId: result.groupId,
        userId: result.userId,
        name: result.name,
        phone: result.phone,
        avatar: result.avatar,
        joinDate: result.joinDate,
        status: result.status,
        role: result.role,
        isAdmin: result.isAdmin,
        canPostInGroup: result.canPostInGroup,
        rotationOrder: result.rotationOrder,
        displayName: result.preferredName || result.name,
        user,
      } as Member;
    });
  }

  async getMemberByUserAndGroup(userId: string, groupId: string): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(schema.members)
      .where(and(
        eq(schema.members.userId, userId),
        eq(schema.members.groupId, groupId)
      ));
    return member;
  }

  async updateMemberPermissions(id: string, canPostInGroup: boolean): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(schema.members)
      .set({ canPostInGroup: canPostInGroup ? 1 : 0 })
      .where(eq(schema.members.id, id))
      .returning();
    return updatedMember;
  }

  async updateMemberAdminStatus(id: string, isAdmin: boolean): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(schema.members)
      .set({ isAdmin: isAdmin ? 1 : 0 })
      .where(eq(schema.members.id, id))
      .returning();
    return updatedMember;
  }

  async updateMemberRotationOrder(id: string, rotationOrder: number): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(schema.members)
      .set({ rotationOrder })
      .where(eq(schema.members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: string, groupId: string): Promise<boolean> {
    const result = await db
      .delete(schema.members)
      .where(and(
        eq(schema.members.id, id),
        eq(schema.members.groupId, groupId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Contributions
  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const [contribution] = await db
      .insert(schema.contributions)
      .values(insertContribution)
      .returning();
    return contribution;
  }

  async getContribution(id: string): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.id, id));
    return contribution;
  }

  async getContributionsByGroupAndCycle(groupId: string, cycle: number): Promise<Contribution[]> {
    return await db
      .select()
      .from(schema.contributions)
      .where(
        and(
          eq(schema.contributions.groupId, groupId),
          eq(schema.contributions.cycle, cycle)
        )
      );
  }

  async getContributionsByGroup(groupId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.groupId, groupId));
  }
  async getContributionByMemberAndCycle(memberId: string, cycle: number): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(schema.contributions)
      .where(
        and(
          eq(schema.contributions.memberId, memberId),
          eq(schema.contributions.cycle, cycle)
        )
      );
    return contribution;
  }

  async updateContributionStatus(
    id: string,
    status: 'paid' | 'pending' | 'overdue',
    datePaid?: string | null
  ): Promise<Contribution | undefined> {
    const [contribution] = await db
      .update(schema.contributions)
      .set({ status, datePaid: datePaid || null })
      .where(eq(schema.contributions.id, id))
      .returning();
    return contribution;
  }

  async updateContributionReceipt(id: string, receiptUrl: string | null): Promise<Contribution | undefined> {
    const [contribution] = await db
      .update(schema.contributions)
      .set({ receiptUrl: receiptUrl })
      .where(eq(schema.contributions.id, id))
      .returning();
    return contribution;
  }

  async markGroupAsCompleted(groupId: string): Promise<void> {
    // Idempotent: only update if status is currently 'active'
    const result = await db
      .update(schema.groups)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(
        and(
          eq(schema.groups.id, groupId),
          eq(schema.groups.status, 'active')
        )
      )
      .returning();
    
    if (result.length > 0) {
      console.log(`[markGroupAsCompleted] Group ${groupId} marked as completed`);
    }
  }

  async checkAndAdvanceCycle(groupId: string, cycle: number): Promise<CycleAdvanceResult> {
    console.log(`\n========== [checkAndAdvanceCycle] START ==========`);
    console.log(`[checkAndAdvanceCycle] GroupId: ${groupId}, Cycle: ${cycle}`);
    
    // Get group first to check current state
    const group = await this.getGroup(groupId);
    if (!group) {
      console.log(`[checkAndAdvanceCycle] Group not found`);
      return { advanced: false, reason: 'Group not found' };
    }

    console.log(`[checkAndAdvanceCycle] Group: ${group.name}, Status: ${group.status}, CurrentCycle: ${group.currentCycle}/${group.totalCycles}`);

    // Check group status
    if (group.status !== 'active') {
      console.log(`[checkAndAdvanceCycle] Group status is '${group.status}', not 'active' - skipping`);
      return { advanced: false, reason: `Group status is '${group.status}' (must be 'active')` };
    }

    // Edge case: If group already past total cycles, mark as completed
    if (group.currentCycle > group.totalCycles) {
      console.log(`[checkAndAdvanceCycle] Group exceeded total cycles (${group.currentCycle}/${group.totalCycles}), marking as completed`);
      await this.markGroupAsCompleted(groupId);
      return { advanced: true, reason: 'Group marked as completed (exceeded total cycles)', groupCompleted: true };
    }

    // CRITICAL: Only advance if group is still on this cycle (prevent double-advancement)
    if (group.currentCycle !== cycle) {
      console.log(`[checkAndAdvanceCycle] Guard: currentCycle (${group.currentCycle}) !== requested cycle (${cycle}), skipping`);
      return { 
        advanced: false, 
        reason: `Cycle mismatch: group is on cycle ${group.currentCycle}, but checking cycle ${cycle}` 
      };
    }

    // Get all active members
    const members = await this.getMembersByGroup(groupId);
    const activeMembers = members.filter(m => m.status === 'active');
    console.log(`[checkAndAdvanceCycle] Active members: ${activeMembers.length}`);

    // Get contributions for this cycle
    let contributions = await this.getContributionsByGroupAndCycle(groupId, cycle);
    console.log(`[checkAndAdvanceCycle] Existing contributions for cycle ${cycle}: ${contributions.length}`);

    // Check for missing contribution records
    const membersWithContributions = new Set(contributions.map(c => c.memberId));
    const membersWithoutContributions = activeMembers.filter(m => !membersWithContributions.has(m.id));
    
    if (membersWithoutContributions.length > 0) {
      console.log(`[checkAndAdvanceCycle] ${membersWithoutContributions.length} members missing contribution records - auto-creating...`);
      
      // Auto-create missing contribution records (as pending)
      for (const member of membersWithoutContributions) {
        console.log(`[checkAndAdvanceCycle] Creating contribution for member: ${member.name} (${member.id})`);
        await this.createContribution({
          groupId,
          memberId: member.id,
          cycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
      }
      
      // Re-fetch contributions after creating
      contributions = await this.getContributionsByGroupAndCycle(groupId, cycle);
      console.log(`[checkAndAdvanceCycle] After auto-create: ${contributions.length} contributions`);
    }

    // Verify contribution count matches member count
    if (contributions.length !== activeMembers.length) {
      console.log(`[checkAndAdvanceCycle] WARNING: Contribution count (${contributions.length}) != member count (${activeMembers.length})`);
      return {
        advanced: false,
        reason: `Contribution count mismatch: ${contributions.length} contributions for ${activeMembers.length} members`,
        totalMembers: activeMembers.length,
        totalContributions: contributions.length,
      };
    }
    
    // Check if all are paid
    const paidContributions = contributions.filter(c => c.status === 'paid');
    const unpaidContributions = contributions.filter(c => c.status !== 'paid');
    const allPaid = contributions.length > 0 && paidContributions.length === contributions.length;
    
    console.log(`[checkAndAdvanceCycle] Paid: ${paidContributions.length}, Unpaid: ${unpaidContributions.length}, All paid: ${allPaid}`);
    
    if (!allPaid) {
      console.log(`[checkAndAdvanceCycle] Not all contributions paid - cannot advance`);
      if (unpaidContributions.length > 0) {
        for (const c of unpaidContributions) {
          const member = activeMembers.find(m => m.id === c.memberId);
          console.log(`[checkAndAdvanceCycle]   - ${member?.name || c.memberId}: ${c.status}`);
        }
      }
      return {
        advanced: false,
        reason: `${unpaidContributions.length} contribution(s) not paid yet`,
        unpaidContributions: unpaidContributions.length,
        totalMembers: activeMembers.length,
        totalContributions: contributions.length,
      };
    }

    // All paid - now advance!
    console.log(`[checkAndAdvanceCycle] ✓ All ${contributions.length} contributions paid!`);
    
    // Check if this is the final cycle
    if (cycle >= group.totalCycles) {
      console.log(`[checkAndAdvanceCycle] *** FINAL CYCLE - MARKING GROUP AS COMPLETED ***`);
      await this.markGroupAsCompleted(groupId);
      return {
        advanced: true,
        reason: 'Final cycle completed - group marked as completed',
        previousCycle: cycle,
        groupCompleted: true,
        totalMembers: activeMembers.length,
        totalContributions: contributions.length,
      };
    }

    // Advance to next cycle
    const nextCycle = cycle + 1;
    console.log(`[checkAndAdvanceCycle] Advancing from cycle ${cycle} to ${nextCycle}`);
    
    // Delete receipts from the completed cycle
    console.log(`[checkAndAdvanceCycle] Deleting receipts for cycle ${cycle}`);
    await this.deleteReceiptsByCycle(groupId, cycle);
    
    // Calculate next collection date - ensure it's always in the future
    const daysToAdd = group.frequency === 'weekly' ? 7 : 30;
    let nextDate = new Date(group.nextCollectionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add at least one interval
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    // If still in the past, keep adding intervals until we reach a future date
    while (nextDate < today) {
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
    
    const nextCollectionDate = nextDate.toISOString().split('T')[0];
    console.log(`[checkAndAdvanceCycle] Next collection date: ${nextCollectionDate} (calculated from ${group.nextCollectionDate})`);

    // Update group to next cycle
    await this.updateGroup(groupId, {
      currentCycle: nextCycle,
      nextCollectionDate,
    });

    // Check if contributions already exist for next cycle (prevent duplicates)
    const existingNextCycleContributions = await this.getContributionsByGroupAndCycle(groupId, nextCycle);
    
    // Only create new contributions if they don't exist yet
    if (existingNextCycleContributions.length === 0) {
      console.log(`[checkAndAdvanceCycle] Creating contribution records for cycle ${nextCycle}`);
      for (const member of activeMembers) {
        await this.createContribution({
          groupId,
          memberId: member.id,
          cycle: nextCycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
      }
    } else {
      console.log(`[checkAndAdvanceCycle] Contributions for cycle ${nextCycle} already exist (${existingNextCycleContributions.length})`);
    }
    
    console.log(`[checkAndAdvanceCycle] ✓ Successfully advanced to cycle ${nextCycle}`);
    console.log(`========== [checkAndAdvanceCycle] END ==========\n`);
    
    return {
      advanced: true,
      reason: `Successfully advanced from cycle ${cycle} to ${nextCycle}`,
      previousCycle: cycle,
      newCycle: nextCycle,
      totalMembers: activeMembers.length,
      totalContributions: contributions.length,
    };
  }

  // Invite Links
  async createInviteLink(inviteLinkDTO: CreateInviteLinkDTO): Promise<InviteLink> {
    // Convert validated DTO (ISO string dates) to storage format (Date objects)
    const storageData = {
      ...inviteLinkDTO,
      expiresAt: inviteLinkDTO.expiresAt ? new Date(inviteLinkDTO.expiresAt) : null,
    };
    
    const [link] = await db.insert(schema.inviteLinks).values(storageData).returning();
    return link;
  }

  async getInviteLink(token: string): Promise<InviteLink | undefined> {
    const [link] = await db
      .select()
      .from(schema.inviteLinks)
      .where(eq(schema.inviteLinks.token, token));
    return link;
  }

  async getInviteLinksByGroup(groupId: string): Promise<InviteLink[]> {
    return await db
      .select()
      .from(schema.inviteLinks)
      .where(eq(schema.inviteLinks.groupId, groupId));
  }

  async incrementInviteLinkUsage(token: string): Promise<InviteLink | undefined> {
    const [link] = await db
      .update(schema.inviteLinks)
      .set({ usedCount: sql`${schema.inviteLinks.usedCount} + 1` })
      .where(eq(schema.inviteLinks.token, token))
      .returning();
    return link;
  }

  async deleteInviteLink(id: string, groupId: string): Promise<boolean> {
    const result = await db
      .delete(schema.inviteLinks)
      .where(and(
        eq(schema.inviteLinks.id, id),
        eq(schema.inviteLinks.groupId, groupId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(schema.messages).values(message).returning();
    return msg;
  }
  
  async getDirectMessages(groupId: string, userId: string): Promise<Message[]> {
    // Get all direct messages in this group where the user is either sender or recipient
    // Ordered ascending (oldest first) for WhatsApp-style display (newest at bottom)
    return await db
      .select()
      .from(schema.messages)
      .where(and(
        eq(schema.messages.groupId, groupId),
        eq(schema.messages.type, 'direct'),
        or(
          eq(schema.messages.senderId, userId),
          eq(schema.messages.recipientId, userId)
        )
      ))
      .orderBy(asc(schema.messages.createdAt));
  }
  
  async getGroupMessages(groupId: string): Promise<Message[]> {
    // Ordered ascending (oldest first) for WhatsApp-style display (newest at bottom)
    return await db
      .select()
      .from(schema.messages)
      .where(and(
        eq(schema.messages.groupId, groupId),
        eq(schema.messages.type, 'group')
      ))
      .orderBy(asc(schema.messages.createdAt));
  }
  
  async deleteMessage(id: string, senderId: string): Promise<boolean> {
    // Only allow deletion of own messages
    const result = await db
      .delete(schema.messages)
      .where(and(
        eq(schema.messages.id, id),
        eq(schema.messages.senderId, senderId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getInboxMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(schema.messages)
      .where(and(
        eq(schema.messages.type, 'inbox'),
        eq(schema.messages.recipientId, userId)
      ))
      .orderBy(desc(schema.messages.createdAt));
  }

  // Join Requests
  async createJoinRequest(request: InsertJoinRequest): Promise<JoinRequest> {
    const [joinRequest] = await db
      .insert(schema.joinRequests)
      .values(request)
      .returning();
    return joinRequest;
  }

  async getJoinRequest(id: string): Promise<JoinRequest | undefined> {
    const [joinRequest] = await db
      .select()
      .from(schema.joinRequests)
      .where(eq(schema.joinRequests.id, id));
    return joinRequest;
  }

  async getJoinRequestsByGroup(groupId: string): Promise<JoinRequest[]> {
    return await db
      .select()
      .from(schema.joinRequests)
      .where(eq(schema.joinRequests.groupId, groupId))
      .orderBy(desc(schema.joinRequests.createdAt));
  }

  async getJoinRequestsByUser(userId: string): Promise<JoinRequest[]> {
    return await db
      .select()
      .from(schema.joinRequests)
      .where(eq(schema.joinRequests.userId, userId))
      .orderBy(desc(schema.joinRequests.createdAt));
  }

  async updateJoinRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<JoinRequest | undefined> {
    const [updatedRequest] = await db
      .update(schema.joinRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.joinRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteJoinRequest(id: string): Promise<boolean> {
    const result = await db
      .delete(schema.joinRequests)
      .where(eq(schema.joinRequests.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Open Groups
  async getOpenGroups(userId?: string): Promise<Group[]> {
    // Get all open groups that are not created by the current user
    if (userId) {
      // Exclude groups created by the current user
      return await db
        .select()
        .from(schema.groups)
        .where(
          and(
            eq(schema.groups.visibility, 'open'),
            sql`${schema.groups.userId} != ${userId}`
          )
        );
    }
    
    // If no userId provided, return all open groups
    return await db
      .select()
      .from(schema.groups)
      .where(eq(schema.groups.visibility, 'open'));
  }
  
  async searchGroups(query: string, userId?: string): Promise<Group[]> {
    // Search for groups by name or ID, excluding closed groups and user's own groups
    const searchPattern = `%${query}%`;
    
    if (userId) {
      // Exclude groups created by the current user and only show open groups
      return await db
        .select()
        .from(schema.groups)
        .where(
          and(
            eq(schema.groups.visibility, 'open'),
            sql`${schema.groups.userId} != ${userId}`,
            or(
              sql`LOWER(${schema.groups.name}) LIKE LOWER(${searchPattern})`,
              eq(schema.groups.id, query)
            )
          )
        );
    }
    
    // If no userId provided, search all open groups
    return await db
      .select()
      .from(schema.groups)
      .where(
        and(
          eq(schema.groups.visibility, 'open'),
          or(
            sql`LOWER(${schema.groups.name}) LIKE LOWER(${searchPattern})`,
            eq(schema.groups.id, query)
          )
        )
      );
  }
  
  // Group Access Verification
  async isUserGroupMember(groupId: string, userId: string): Promise<boolean> {
    // Check if user is the group owner
    const group = await this.getGroup(groupId, userId);
    if (group) return true;
    
    // Check if user is a member of the group
    const members = await this.getMembersByGroup(groupId);
    return members.some(m => m.userId === userId);
  }
  
  // Admin User Management
  async updateUserStatus(userId: string, status: 'active' | 'restricted' | 'banned' | 'deleted', restrictedUntil?: Date | null): Promise<User | undefined> {
    // Get current user to check if they're being reactivated from deleted status
    const currentUser = await this.getUser(userId);
    
    const updates: Partial<UpsertUser> = {
      status,
      updatedAt: new Date(),
    };
    
    if (status === 'deleted') {
      updates.deletedAt = new Date();
    } else if (status === 'active' && currentUser) {
      // Clear deletedAt when activating user
      updates.deletedAt = null;
      
      // ONLY increment deletion count if user was previously deleted
      if (currentUser.status === 'deleted') {
        updates.deletionCount = (currentUser.deletionCount || 0) + 1;
      }
    }
    
    // Only update restrictedUntil if explicitly provided for restricted status
    if (status === 'restricted') {
      if (restrictedUntil !== undefined) {
        updates.restrictedUntil = restrictedUntil;
      }
    } else {
      // Clear restriction date when changing to non-restricted status
      updates.restrictedUntil = null;
    }
    
    const [user] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }
  
  async adminUpdateUserProfile(userId: string, updates: Partial<UpdateUserProfileInput>): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }
  
  async getUserActivity(userId: string): Promise<{
    groupsCreated: number;
    groupsJoined: number;
    totalContributions: number;
    messages: number;
  }> {
    const [groupsCreatedResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.groups)
      .where(eq(schema.groups.userId, userId));
    
    const [groupsJoinedResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${schema.members.groupId})::int` })
      .from(schema.members)
      .where(eq(schema.members.userId, userId));
    
    const [contributionsResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.contributions)
      .innerJoin(schema.members, eq(schema.contributions.memberId, schema.members.id))
      .where(eq(schema.members.userId, userId));
    
    const [messagesResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.messages)
      .where(eq(schema.messages.senderId, userId));
    
    return {
      groupsCreated: groupsCreatedResult?.count || 0,
      groupsJoined: groupsJoinedResult?.count || 0,
      totalContributions: contributionsResult?.count || 0,
      messages: messagesResult?.count || 0,
    };
  }
  
  // Account Deletion (Apple App Store requirement)
  async deleteUserAccount(userId: string): Promise<boolean> {
    try {
      // 1. Delete user's messages
      await db.delete(schema.messages).where(eq(schema.messages.senderId, userId));
      
      // 2. Delete user's join requests
      await db.delete(schema.joinRequests).where(eq(schema.joinRequests.userId, userId));
      
      // 3. Delete user's savings pots and transactions
      const pots = await db.select().from(schema.savingsPots).where(eq(schema.savingsPots.userId, userId));
      for (const pot of pots) {
        await db.delete(schema.potTransactions).where(eq(schema.potTransactions.potId, pot.id));
      }
      await db.delete(schema.savingsPots).where(eq(schema.savingsPots.userId, userId));
      
      // 4. Delete user's invite links they created
      await db.delete(schema.inviteLinks).where(eq(schema.inviteLinks.createdBy, userId));
      
      // 5. Update member records to remove userId (soft delete - preserve group integrity)
      await db.update(schema.members)
        .set({ userId: null, name: 'Deleted User' })
        .where(eq(schema.members.userId, userId));
      
      // 6. Delete groups owned by user (cascade will delete members, contributions)
      await db.delete(schema.groups).where(eq(schema.groups.userId, userId));
      
      // 7. Delete audit events related to user
      await db.delete(schema.auditEvents).where(eq(schema.auditEvents.targetUserId, userId));
      
      // 8. Finally, delete the user record
      const result = await db.delete(schema.users).where(eq(schema.users.id, userId)).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('[deleteUserAccount] Error deleting user account:', error);
      throw error;
    }
  }
  
  // Audit Logging
  async createAuditEvent(event: schema.InsertAuditEvent): Promise<schema.AuditEvent> {
    const [auditEvent] = await db
      .insert(schema.auditEvents)
      .values(event)
      .returning();
    return auditEvent;
  }
  
  async getAuditEvents(limit: number = 100): Promise<schema.AuditEvent[]> {
    return await db
      .select()
      .from(schema.auditEvents)
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(limit);
  }
  
  async getUserAuditEvents(userId: string, limit: number = 50): Promise<schema.AuditEvent[]> {
    return await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.targetUserId, userId))
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(limit);
  }
  
  // Admin Analytics
  async getAllGroupsAdmin(): Promise<Array<Group & { memberCount: number; creatorEmail?: string | null }>> {
    const groups = await db.select().from(schema.groups);
    
    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const members = await this.getMembersByGroup(group.id);
        const creator = await this.getUser(group.userId);
        return {
          ...group,
          memberCount: members.length,
          creatorEmail: creator?.email,
        };
      })
    );
    
    return groupsWithCounts;
  }

  async getGroupWithMembersAdmin(groupId: string): Promise<{
    group: Group;
    members: Array<Member & { email?: string | null; displayName?: string | null }>;
  } | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;
    
    const members = await this.getMembersByGroup(groupId);
    
    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = member.userId ? await this.getUser(member.userId) : null;
        return {
          ...member,
          email: user?.email,
          displayName: member.displayName || `${user?.firstName} ${user?.lastName}`.trim() || member.name,
        };
      })
    );
    
    return {
      group,
      members: membersWithDetails,
    };
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    // Delete in order: contributions -> members -> join requests -> invite links -> messages -> group
    await db.delete(schema.contributions).where(
      sql`${schema.contributions.memberId} IN (SELECT id FROM ${schema.members} WHERE group_id = ${groupId})`
    );
    await db.delete(schema.members).where(eq(schema.members.groupId, groupId));
    await db.delete(schema.joinRequests).where(eq(schema.joinRequests.groupId, groupId));
    await db.delete(schema.inviteLinks).where(eq(schema.inviteLinks.groupId, groupId));
    await db.delete(schema.messages).where(eq(schema.messages.groupId, groupId));
    
    const result = await db.delete(schema.groups).where(eq(schema.groups.id, groupId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDashboardStats(): Promise<{
    userStats: {
      total: number;
      active: number;
      restricted: number;
      banned: number;
      deleted: number;
    };
    groupStats: {
      total: number;
      active: number;
      completed: number;
      pending: number;
      byCurrency: { currency: string; count: number }[];
      byFrequency: { frequency: string; count: number }[];
    };
    contributionStats: {
      totalByCurrency: { currency: string; total: number }[];
    };
  }> {
    // User stats
    const [totalUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.users);
    const [activeUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.users).where(eq(schema.users.status, 'active'));
    const [restrictedUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.users).where(eq(schema.users.status, 'restricted'));
    const [bannedUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.users).where(eq(schema.users.status, 'banned'));
    const [deletedUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.users).where(eq(schema.users.status, 'deleted'));
    
    // Group stats
    const [totalGroupsResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.groups);
    const [activeGroupsResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.groups).where(eq(schema.groups.status, 'active'));
    const [completedGroupsResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.groups).where(eq(schema.groups.status, 'completed'));
    const [pendingGroupsResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.groups).where(eq(schema.groups.status, 'pending'));
    
    const groupsByCurrency = await db
      .select({
        currency: schema.groups.currency,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.groups)
      .groupBy(schema.groups.currency);
    
    const groupsByFrequency = await db
      .select({
        frequency: schema.groups.frequency,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.groups)
      .groupBy(schema.groups.frequency);
    
    // Contribution stats - total amount by currency
    const contributionsByCurrency = await db
      .select({
        currency: schema.groups.currency,
        total: sql<number>`COALESCE(SUM(${schema.contributions.amount}), 0)::int`,
      })
      .from(schema.contributions)
      .innerJoin(schema.groups, eq(schema.contributions.groupId, schema.groups.id))
      .where(eq(schema.contributions.status, 'paid'))
      .groupBy(schema.groups.currency);
    
    return {
      userStats: {
        total: totalUsersResult?.count || 0,
        active: activeUsersResult?.count || 0,
        restricted: restrictedUsersResult?.count || 0,
        banned: bannedUsersResult?.count || 0,
        deleted: deletedUsersResult?.count || 0,
      },
      groupStats: {
        total: totalGroupsResult?.count || 0,
        active: activeGroupsResult?.count || 0,
        completed: completedGroupsResult?.count || 0,
        pending: pendingGroupsResult?.count || 0,
        byCurrency: groupsByCurrency.map(g => ({ currency: g.currency, count: g.count })),
        byFrequency: groupsByFrequency.map(g => ({ frequency: g.frequency, count: g.count })),
      },
      contributionStats: {
        totalByCurrency: contributionsByCurrency.map(c => ({ currency: c.currency, total: c.total })),
      },
    };
  }

  // Payment Receipts
  async createPaymentReceipt(receipt: schema.InsertPaymentReceipt): Promise<schema.PaymentReceipt> {
    const [created] = await db.insert(schema.paymentReceipts).values(receipt).returning();
    return created;
  }

  async getReceiptsByGroupCycle(groupId: string, cycleNumber: number): Promise<schema.PaymentReceipt[]> {
    return await db
      .select()
      .from(schema.paymentReceipts)
      .where(
        and(
          eq(schema.paymentReceipts.groupId, groupId),
          eq(schema.paymentReceipts.cycleNumber, cycleNumber)
        )
      )
      .orderBy(desc(schema.paymentReceipts.uploadedAt));
  }

  async getReceiptsByMember(memberId: string): Promise<schema.PaymentReceipt[]> {
    return await db
      .select()
      .from(schema.paymentReceipts)
      .where(eq(schema.paymentReceipts.memberId, memberId))
      .orderBy(desc(schema.paymentReceipts.uploadedAt));
  }

  async deleteReceiptsByCycle(groupId: string, cycleNumber: number): Promise<void> {
    // Get all contributions for this cycle that have receipts
    const contributions = await db
      .select()
      .from(schema.contributions)
      .where(
        and(
          eq(schema.contributions.groupId, groupId),
          eq(schema.contributions.cycle, cycleNumber)
        )
      );
    
    // Delete physical receipt files from disk
    for (const contribution of contributions) {
      if (contribution.receiptUrl) {
        const filePath = path.join(process.cwd(), contribution.receiptUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[deleteReceiptsByCycle] Deleted receipt file: ${filePath}`);
          } catch (error) {
            console.error(`[deleteReceiptsByCycle] Failed to delete file: ${filePath}`, error);
          }
        }
      }
    }
    
    // Clear receiptUrl field in database
    await db
      .update(schema.contributions)
      .set({ receiptUrl: null })
      .where(
        and(
          eq(schema.contributions.groupId, groupId),
          eq(schema.contributions.cycle, cycleNumber)
        )
      );
  }

  // Savings Pots
  async createSavingsPot(pot: schema.InsertSavingsPot): Promise<schema.SavingsPot> {
    const [created] = await db.insert(schema.savingsPots).values(pot).returning();
    return created;
  }

  async getSavingsPotsByUser(userId: string): Promise<schema.SavingsPot[]> {
    return await db
      .select()
      .from(schema.savingsPots)
      .where(eq(schema.savingsPots.userId, userId))
      .orderBy(desc(schema.savingsPots.createdAt));
  }

  async getSavingsPot(id: string): Promise<schema.SavingsPot | undefined> {
    const [pot] = await db
      .select()
      .from(schema.savingsPots)
      .where(eq(schema.savingsPots.id, id));
    return pot;
  }

  async updatePotBalance(
    potId: string,
    balances: Partial<{
      balanceNGN: string;
      balanceGBP: string;
      balanceUSD: string;
      balanceEUR: string;
    }>
  ): Promise<schema.SavingsPot | undefined> {
    const [updated] = await db
      .update(schema.savingsPots)
      .set(balances)
      .where(eq(schema.savingsPots.id, potId))
      .returning();
    return updated;
  }

  async deleteSavingsPot(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(schema.savingsPots)
      .where(
        and(
          eq(schema.savingsPots.id, id),
          eq(schema.savingsPots.userId, userId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Pot Transactions
  async createPotTransaction(transaction: schema.InsertPotTransaction): Promise<schema.PotTransaction> {
    const [created] = await db.insert(schema.potTransactions).values(transaction).returning();
    return created;
  }

  async getPotTransactions(potId: string): Promise<schema.PotTransaction[]> {
    return await db
      .select()
      .from(schema.potTransactions)
      .where(eq(schema.potTransactions.potId, potId))
      .orderBy(desc(schema.potTransactions.createdAt));
  }

  // User Funds
  async updateUserFunds(
    userId: string,
    funds: Partial<{
      totalFundsNGN: string;
      totalFundsGBP: string;
      totalFundsUSD: string;
      totalFundsEUR: string;
    }>
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(schema.users)
      .set(funds)
      .where(eq(schema.users.id, userId))
      .returning();
    return updated;
  }

  // Affiliate Partners
  async createPartner(partner: schema.InsertPartner): Promise<schema.Partner> {
    const [created] = await db
      .insert(schema.partners)
      .values({
        ...partner,
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async getPartners(activeOnly: boolean = false): Promise<schema.Partner[]> {
    if (activeOnly) {
      return await db
        .select()
        .from(schema.partners)
        .where(eq(schema.partners.isActive, 1))
        .orderBy(desc(schema.partners.createdAt));
    }
    return await db
      .select()
      .from(schema.partners)
      .orderBy(desc(schema.partners.createdAt));
  }

  async getPartner(id: string): Promise<schema.Partner | undefined> {
    const [partner] = await db
      .select()
      .from(schema.partners)
      .where(eq(schema.partners.id, id));
    return partner;
  }

  async updatePartner(id: string, updates: Partial<schema.InsertPartner>): Promise<schema.Partner | undefined> {
    const [updated] = await db
      .update(schema.partners)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.partners.id, id))
      .returning();
    return updated;
  }

  async deletePartner(id: string): Promise<boolean> {
    const result = await db
      .delete(schema.partners)
      .where(eq(schema.partners.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Partner Click Tracking
  async trackPartnerClick(partnerId: string, userId: string | null): Promise<schema.PartnerClick> {
    const [click] = await db
      .insert(schema.partnerClicks)
      .values({
        partnerId,
        userId,
      })
      .returning();
    return click;
  }

  async getPartnerAnalytics(partnerId?: string): Promise<{
    partnerId: string;
    partnerName: string;
    totalClicks: number;
    clicksThisMonth: number;
    clicksToday: number;
  }[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build base query
    let partnersQuery = db.select().from(schema.partners);
    
    if (partnerId) {
      partnersQuery = partnersQuery.where(eq(schema.partners.id, partnerId)) as any;
    }

    const partners = await partnersQuery;

    const analytics = await Promise.all(
      partners.map(async (partner) => {
        // Total clicks
        const totalClicksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.partnerClicks)
          .where(eq(schema.partnerClicks.partnerId, partner.id));
        
        // Clicks this month
        const monthClicksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.partnerClicks)
          .where(
            and(
              eq(schema.partnerClicks.partnerId, partner.id),
              sql`${schema.partnerClicks.clickedAt} >= ${startOfMonth}`
            )
          );
        
        // Clicks today
        const todayClicksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.partnerClicks)
          .where(
            and(
              eq(schema.partnerClicks.partnerId, partner.id),
              sql`${schema.partnerClicks.clickedAt} >= ${startOfDay}`
            )
          );

        return {
          partnerId: partner.id,
          partnerName: partner.name,
          totalClicks: Number(totalClicksResult[0]?.count || 0),
          clicksThisMonth: Number(monthClicksResult[0]?.count || 0),
          clicksToday: Number(todayClicksResult[0]?.count || 0),
        };
      })
    );

    return analytics;
  }

  // Device Tokens (Push Notifications)
  async registerDeviceToken(tokenData: schema.InsertDeviceToken): Promise<schema.DeviceToken> {
    const [existing] = await db
      .select()
      .from(schema.deviceTokens)
      .where(eq(schema.deviceTokens.token, tokenData.token));
    
    if (existing) {
      const [updated] = await db
        .update(schema.deviceTokens)
        .set({
          userId: tokenData.userId,
          platform: tokenData.platform,
          deviceName: tokenData.deviceName,
          isActive: 1,
          lastUsed: new Date(),
        })
        .where(eq(schema.deviceTokens.token, tokenData.token))
        .returning();
      return updated;
    }
    
    const [token] = await db
      .insert(schema.deviceTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getDeviceTokensByUser(userId: string): Promise<schema.DeviceToken[]> {
    return await db
      .select()
      .from(schema.deviceTokens)
      .where(and(
        eq(schema.deviceTokens.userId, userId),
        eq(schema.deviceTokens.isActive, 1)
      ))
      .orderBy(desc(schema.deviceTokens.lastUsed));
  }

  async getUserDeviceTokens(userId: string): Promise<schema.DeviceToken[]> {
    return await this.getDeviceTokensByUser(userId);
  }

  async updateDeviceTokenLastUsed(token: string): Promise<schema.DeviceToken | undefined> {
    const [updated] = await db
      .update(schema.deviceTokens)
      .set({ lastUsed: new Date() })
      .where(eq(schema.deviceTokens.token, token))
      .returning();
    return updated;
  }

  async deactivateDeviceToken(token: string): Promise<boolean> {
    const result = await db
      .update(schema.deviceTokens)
      .set({ isActive: 0 })
      .where(eq(schema.deviceTokens.token, token));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Settings
  async getUserSettings(userId: string): Promise<schema.UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: schema.InsertUserSettings): Promise<schema.UserSettings> {
    const [created] = await db
      .insert(schema.userSettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateUserSettings(userId: string, updates: schema.UpdateUserSettings): Promise<schema.UserSettings | undefined> {
    const dbUpdates: any = { updatedAt: new Date() };
    
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.inactivityTimeoutEnabled !== undefined) dbUpdates.inactivityTimeoutEnabled = updates.inactivityTimeoutEnabled ? 1 : 0;
    if (updates.inactivityTimeoutMinutes !== undefined) dbUpdates.inactivityTimeoutMinutes = updates.inactivityTimeoutMinutes;
    if (updates.biometricEnabled !== undefined) dbUpdates.biometricEnabled = updates.biometricEnabled ? 1 : 0;
    if (updates.pushNotificationsEnabled !== undefined) dbUpdates.pushNotificationsEnabled = updates.pushNotificationsEnabled ? 1 : 0;
    if (updates.emailNotificationsEnabled !== undefined) dbUpdates.emailNotificationsEnabled = updates.emailNotificationsEnabled ? 1 : 0;
    
    const existing = await this.getUserSettings(userId);
    if (!existing) {
      return await this.createUserSettings({
        userId,
        theme: updates.theme || 'light',
        inactivityTimeoutEnabled: updates.inactivityTimeoutEnabled !== undefined ? (updates.inactivityTimeoutEnabled ? 1 : 0) : 1,
        inactivityTimeoutMinutes: updates.inactivityTimeoutMinutes || 3,
        biometricEnabled: updates.biometricEnabled ? 1 : 0,
        pushNotificationsEnabled: updates.pushNotificationsEnabled !== undefined ? (updates.pushNotificationsEnabled ? 1 : 0) : 1,
        emailNotificationsEnabled: updates.emailNotificationsEnabled !== undefined ? (updates.emailNotificationsEnabled ? 1 : 0) : 1,
      });
    }
    
    const [updated] = await db
      .update(schema.userSettings)
      .set(dbUpdates)
      .where(eq(schema.userSettings.userId, userId))
      .returning();
    return updated;
  }

  // Data Exports
  async createDataExport(exportRequest: schema.InsertDataExport): Promise<schema.DataExport> {
    const [created] = await db
      .insert(schema.dataExports)
      .values(exportRequest)
      .returning();
    return created;
  }

  async getDataExportsByUser(userId: string): Promise<schema.DataExport[]> {
    return await db
      .select()
      .from(schema.dataExports)
      .where(eq(schema.dataExports.userId, userId))
      .orderBy(desc(schema.dataExports.requestedAt));
  }

  async updateDataExport(id: string, updates: Partial<schema.DataExport>): Promise<schema.DataExport | undefined> {
    const [updated] = await db
      .update(schema.dataExports)
      .set(updates)
      .where(eq(schema.dataExports.id, id))
      .returning();
    return updated;
  }

  async getContributionHistoryForExport(userId: string): Promise<{
    groupName: string;
    memberName: string;
    cycle: number;
    amount: number;
    currency: string;
    status: string;
    datePaid: string | null;
    createdAt: Date;
  }[]> {
    const userMembers = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.userId, userId));
    
    if (userMembers.length === 0) return [];
    
    const memberIds = userMembers.map(m => m.id);
    const groupIds = Array.from(new Set(userMembers.map(m => m.groupId)));
    
    const [groups, contributions] = await Promise.all([
      db.select().from(schema.groups).where(sql`${schema.groups.id} IN ${groupIds}`),
      db.select().from(schema.contributions).where(sql`${schema.contributions.memberId} IN ${memberIds}`)
    ]);
    
    const groupMap = new Map(groups.map(g => [g.id, g]));
    const memberMap = new Map(userMembers.map(m => [m.id, m]));
    
    return contributions.map(c => {
      const member = memberMap.get(c.memberId);
      const group = member ? groupMap.get(member.groupId) : undefined;
      return {
        groupName: group?.name || 'Unknown Group',
        memberName: member?.name || 'Unknown',
        cycle: c.cycle,
        amount: c.amount,
        currency: group?.currency || 'NGN',
        status: c.status,
        datePaid: c.datePaid,
        createdAt: c.createdAt,
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Notifications
  async createNotification(notification: schema.InsertNotification): Promise<schema.Notification> {
    const [created] = await db
      .insert(schema.notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getNotificationsByUser(userId: string, limit = 50): Promise<schema.Notification[]> {
    return await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.sentAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: string, userId: string): Promise<schema.Notification | undefined> {
    const [updated] = await db
      .update(schema.notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId)
      ))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(schema.notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, 0)
      ));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, 0)
      ));
    return Number(result?.count || 0);
  }
}

export const storage = new DbStorage();
