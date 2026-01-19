import type { Express } from "express";
import { createServer, type Server } from "http";
import { getAuth } from "@clerk/express";
import { storage } from "./storage";
import { insertGroupSchema, insertMemberSchema, insertContributionSchema, updateUserProfileSchema, createInviteLinkDTOSchema, insertMessageSchema, type GroupCreateInput } from "@shared/schema";
import * as schema from "@shared/schema";
import { z } from "zod";
import { setupClerkAuth, clerkAuthMiddleware, getOrCreateUserFromClerk } from "./clerkAuth";
import { isInviteExpired, isInviteMaxedOut } from "./dateUtils";
import multer from "multer";
import * as path from "node:path";
import * as fs from "node:fs";

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/receipts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure separate multer for profile photo uploads
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for avatars
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for partner logo uploads
const partnerLogoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/partners';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'partner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPartnerLogo = multer({
  storage: partnerLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for partner logos
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'));
    }
  }
});

// Helper function to get userId from request (Clerk auth)
function getUserId(req: any): string {
  // Clerk auth stores dbUser from middleware
  if (req.dbUser?.id) {
    return req.dbUser.id;
  }
  throw new Error('User ID not found in request');
}

function normalizeBoolean(value: unknown): 0 | 1 | null {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
}

// Clerk authentication middleware (replaces JWT auth)
const authMiddleware = clerkAuthMiddleware;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Clerk authentication routes
  setupClerkAuth(app);
  
  // Helper function to check and update group go-live status
  async function checkAndUpdateGoLiveStatus(groupId: string) {
    // Don't filter by userId - we need to check any group's status
    const group = await storage.getGroup(groupId);
    if (!group || group.isLive) return group;
    
    const members = await storage.getMembersByGroup(groupId);
    const now = new Date();
    const goLiveDate = new Date(group.goLiveDate);
    
    // Check if go-live conditions are met: date reached AND 3+ members
    if (goLiveDate <= now && members.length >= 3) {
      // Adjust total cycles to member count if needed
      await storage.adjustCyclesToMemberCount(groupId);
      
      // Re-query members to get accurate count after adjustment
      const updatedMembers = await storage.getMembersByGroup(groupId);
      
      // Activate group: set status to 'active', mark as live, close invites, record timestamp
      // Use group owner's ID for authorization
      const updatedGroup = await storage.updateGroup(groupId, { 
        isLive: 1,
        status: 'active',
        visibility: 'closed',
        adjustedGoLiveDate: new Date(),
        totalCycles: updatedMembers.length
      }, group.userId);
      return updatedGroup;
    }
    
    return group;
  }

  // Profile endpoint
  app.patch('/api/profile', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = updateUserProfileSchema.parse(req.body);
      
      const user = await storage.updateUserProfile(userId, validated);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Upload profile photo
  app.post('/api/users/profile-photo', authMiddleware, uploadAvatar.single('avatar'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get current user to check if they have an old profile photo
      const user = await storage.getUser(userId);
      if (!user) {
        // Delete uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete old profile photo if it exists and is a custom upload (not from avatar pack)
      if (user.profileImageUrl && (user.profileImageUrl.startsWith('uploads/avatars/') || user.profileImageUrl.startsWith('/uploads/avatars/'))) {
        const oldPath = path.join(process.cwd(), user.profileImageUrl.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      // Update user profile with new photo URL (ensure it starts with /)
      const profileImageUrl = '/' + req.file.path;
      const updatedUser = await storage.updateUserProfile(userId, { profileImageUrl });
      
      res.json({ profileImageUrl, message: "Profile photo uploaded successfully" });
    } catch (error) {
      console.error('Profile photo upload error:', error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload profile photo" });
    }
  });

  // Get user by ID endpoint
  app.get('/api/users/:userId', authMiddleware, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Delete user account (Apple App Store requirement)
  app.delete('/api/account', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete all user data
      const deleted = await storage.deleteUserAccount(userId);
      
      if (deleted) {
        res.json({ message: "Account deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete account" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Admin middleware - Check if user is admin AND has the authorized email
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = getUserId(req);
      const currentUser = await storage.getUser(userId);
      
      // CRITICAL: Only afolinks@outlook.com can access admin panel
      const AUTHORIZED_ADMIN_EMAIL = 'afolinks@outlook.com';
      
      if (!currentUser || currentUser.isAdmin !== 1 || currentUser.email !== AUTHORIZED_ADMIN_EMAIL) {
        return res.status(403).json({ error: "Unauthorized. Admin access only." });
      }
      
      req.adminUser = currentUser;
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to verify admin status" });
    }
  };

  // Admin endpoint - Get all users (restricted to admin role)
  app.get('/api/admin/users', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Calculate stats - count users with at least basic info (name) and bank details
      const totalUsers = users.length;
      const usersWithProfiles = users.filter(u => {
        const hasName = u.firstName?.trim() && u.lastName?.trim();
        const hasPhone = u.phone?.trim();
        const hasLocalBank = u.localBankAccountNumber?.trim();
        const hasIntlBank = u.internationalBankAccountNumber?.trim();
        const hasAnyBank = hasLocalBank || hasIntlBank;
        
        // Count as complete if they have: name, phone, and at least one bank account
        return hasName && hasPhone && hasAnyBank;
      }).length;
      
      const stats = {
        totalUsers,
        profileCompletionRate: totalUsers > 0 ? Math.round((usersWithProfiles / totalUsers) * 100) : 0,
      };
      
      res.json({ users, stats });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Admin endpoint - Get dashboard stats
  app.get('/api/admin/dashboard', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  
  // Admin endpoint - Update user status
  app.post('/api/admin/users/:userId/status', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { status, restrictedUntil } = req.body;
      
      if (!['active', 'restricted', 'banned', 'deleted'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      
      // Get current user to preserve previous status for audit
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const previousStatus = currentUser.status;
      
      // Parse restrictedUntil if provided
      let parsedRestrictedUntil: Date | null = null;
      if (restrictedUntil) {
        parsedRestrictedUntil = new Date(restrictedUntil);
        if (isNaN(parsedRestrictedUntil.getTime())) {
          return res.status(400).json({ error: "Invalid restrictedUntil date" });
        }
      }
      
      const user = await storage.updateUserStatus(userId, status, parsedRestrictedUntil);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Log audit event with correct previous and new status
      let action: 'user_banned' | 'user_unbanned' | 'user_restricted' | 'user_deleted' | 'status_changed' = 'status_changed';
      if (status === 'banned') action = 'user_banned';
      else if (status === 'deleted') action = 'user_deleted';
      else if (status === 'restricted') action = 'user_restricted';
      else if (status === 'active') action = 'user_unbanned';
      
      await storage.createAuditEvent({
        actorId: req.adminUser.id,
        targetUserId: userId,
        action,
        metadata: { previousStatus, newStatus: status, restrictedUntil: parsedRestrictedUntil?.toISOString() || null },
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });
  
  // Admin endpoint - Update user profile
  app.patch('/api/admin/users/:userId/profile', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const validated = updateUserProfileSchema.parse(req.body);
      
      const user = await storage.adminUpdateUserProfile(userId, validated);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Log audit event
      await storage.createAuditEvent({
        actorId: req.adminUser.id,
        targetUserId: userId,
        action: 'profile_edited',
        metadata: { updates: validated },
      });
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  
  // Admin endpoint - Get user activity
  app.get('/api/admin/users/:userId/activity', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const activity = await storage.getUserActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });
  
  // Admin endpoint - Get audit events
  app.get('/api/admin/audit-events', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const events = await storage.getAuditEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching audit events:", error);
      res.status(500).json({ error: "Failed to fetch audit events" });
    }
  });
  
  // Admin endpoint - Get user audit events
  app.get('/api/admin/users/:userId/audit', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.getUserAuditEvents(userId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user audit events:", error);
      res.status(500).json({ error: "Failed to fetch user audit events" });
    }
  });
  
  // Admin endpoint - Execute SQL query (read-only)
  // Admin: Get all groups
  app.get('/api/admin/groups', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const groups = await storage.getAllGroupsAdmin();
      res.json(groups);
    } catch (error) {
      console.error('Error fetching admin groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  // Admin: Get group details with participants
  app.get('/api/admin/groups/:id', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const groupDetails = await storage.getGroupWithMembersAdmin(id);
      
      if (!groupDetails) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.json(groupDetails);
    } catch (error) {
      console.error('Error fetching group details:', error);
      res.status(500).json({ error: 'Failed to fetch group details' });
    }
  });

  // Admin: Delete group (with audit logging)
  app.delete('/api/admin/groups/:id', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUserId = getUserId(req);
      
      // Get group info before deletion for audit
      const group = await storage.getGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Delete the group
      const success = await storage.deleteGroup(id);
      if (!success) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Log the audit event
      await storage.createAuditEvent({
        actorId: adminUserId,
        targetUserId: group.userId,
        action: 'group_deleted',
        metadata: {
          groupId: id,
          groupName: group.name,
          deletedBy: 'admin'
        }
      });
      
      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  });

  app.post('/api/admin/sql-query', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }
      
      // Security: Block destructive operations
      // Remove all comments and normalize whitespace before checking
      const destructiveKeywords = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
        'TRUNCATE', 'REPLACE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
        'CALL', 'MERGE', 'UPSERT'
      ];
      
      // Remove SQL comments (-- and /* */) and normalize whitespace
      const cleanedQuery = query
        .replace(/--[^\n]*/g, '') // Remove -- style comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ style comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .toUpperCase()
        .trim();
      
      // Check if query contains destructive keywords anywhere
      const isDestructive = destructiveKeywords.some(keyword => 
        cleanedQuery.includes(keyword)
      );
      
      // Also check if query starts with SELECT (after cleaning)
      if (isDestructive || !cleanedQuery.startsWith('SELECT')) {
        return res.status(403).json({ 
          error: "Only SELECT queries are allowed for security reasons" 
        });
      }
      
      // Security: Prevent multi-statement injection (e.g., "SELECT 1; DELETE FROM users;")
      // Count semicolons - allow only 0 or 1 (at the end)
      const semicolonCount = (cleanedQuery.match(/;/g) || []).length;
      const endsWithSemicolon = cleanedQuery.endsWith(';');
      
      if (semicolonCount > 1 || (semicolonCount === 1 && !endsWithSemicolon)) {
        return res.status(403).json({ 
          error: "Multi-statement queries are not allowed for security reasons" 
        });
      }
      
      // Execute query
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const { sql } = await import('drizzle-orm');
      const db = drizzle(process.env.DATABASE_URL!);
      
      const result = await db.execute(sql.raw(query));
      
      // Log audit event with correct action
      await storage.createAuditEvent({
        actorId: req.adminUser.id,
        targetUserId: null,
        action: 'sql_query_executed',
        metadata: { sqlQuery: query, resultCount: result.rows?.length || 0 },
      });
      
      res.json({ 
        rows: result.rows || [],
        rowCount: result.rows?.length || 0 
      });
    } catch (error: any) {
      console.error("Error executing SQL query:", error);
      res.status(500).json({ 
        error: "Failed to execute query",
        details: error.message 
      });
    }
  });

  // Admin endpoint - Get all groups
  app.get('/api/admin/groups', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const groups = await storage.getAllGroupsAdmin();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching admin groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Admin endpoint - Get group with members
  app.get('/api/admin/groups/:groupId', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      const groupData = await storage.getGroupWithMembersAdmin(groupId);
      
      if (!groupData) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json(groupData);
    } catch (error) {
      console.error("Error fetching group details:", error);
      res.status(500).json({ error: "Failed to fetch group details" });
    }
  });

  // Admin endpoint - Delete group
  app.delete('/api/admin/groups/:groupId', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      
      // Get group info before deletion for audit log
      const groupData = await storage.getGroupWithMembersAdmin(groupId);
      if (!groupData) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const success = await storage.deleteGroup(groupId);
      
      if (!success) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Log audit event
      await storage.createAuditEvent({
        actorId: req.adminUser.id,
        targetUserId: groupData.group.userId,
        action: 'group_deleted',
        metadata: { 
          groupId, 
          groupName: groupData.group.name,
          memberCount: groupData.members.length 
        },
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Admin endpoint - Adjust go-live date
  app.patch('/api/admin/groups/:groupId/go-live-date', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      const { goLiveDate } = req.body;
      
      if (!goLiveDate) {
        return res.status(400).json({ error: "Go-live date is required" });
      }
      
      // Validate date format
      const newDate = new Date(goLiveDate);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Don't allow changing go-live date for groups that have already gone live
      if (group.isLive) {
        return res.status(400).json({ error: "Cannot adjust go-live date for groups that are already live" });
      }
      
      // Update the go-live date (adjustedGoLiveDate will be set on first payment)
      const updatedGroup = await storage.updateGroup(groupId, { 
        goLiveDate: newDate
      });
      
      // Log audit event
      await storage.createAuditEvent({
        actorId: req.adminUser.id,
        targetUserId: group.userId,
        action: 'profile_edited',
        metadata: { 
          groupId, 
          groupName: group.name,
          oldGoLiveDate: group.goLiveDate,
          newGoLiveDate: goLiveDate
        },
      });
      
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adjusting go-live date:", error);
      res.status(500).json({ error: "Failed to adjust go-live date" });
    }
  });

  // Groups endpoints - All require authentication
  app.get("/api/groups", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const groups = await storage.getAllGroups(userId);
      
      // Check and update go-live status for groups that are due
      const now = new Date();
      await Promise.all(
        groups
          .filter(g => !g.isLive && new Date(g.goLiveDate) <= now)
          .map(g => checkAndUpdateGoLiveStatus(g.id))
      );
      
      // Re-fetch groups to get updated status
      const updatedGroups = await storage.getAllGroups(userId);
      const groupsWithMembers = await Promise.all(
        updatedGroups.map(async (group) => {
          const members = await storage.getMembersByGroup(group.id);
          return {
            ...group,
            members,
            currentRecipientId: members.find(m => m.rotationOrder === group.currentCycle)?.id || null,
          };
        })
      );
      res.json(groupsWithMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Search for groups by name or ID (only groups that haven't gone live)
  // MUST come before /api/groups/:id to avoid matching "search" as an ID
  app.get("/api/groups/search", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const query = req.query.q as string;
      
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      
      const searchResults = await storage.searchGroups(query.trim(), userId);
      
      // Filter out groups that are already live
      const availableGroups = searchResults.filter(group => !group.isLive);
      
      // Get user's existing join requests to filter out already-requested groups
      const userRequests = await storage.getJoinRequestsByUser(userId);
      const requestedGroupIds = new Set(userRequests.map(r => r.groupId));
      
      // Filter out groups user has already requested to join
      const filteredGroups = availableGroups.filter(group => !requestedGroupIds.has(group.id));
      
      // Include member count for each group
      const groupsWithMemberCount = await Promise.all(
        filteredGroups.map(async (group) => {
          const members = await storage.getMembersByGroup(group.id);
          const isFull = group.maxMembers ? members.length >= group.maxMembers : false;
          return {
            ...group,
            memberCount: members.length,
            isFull,
          };
        })
      );
      
      res.json(groupsWithMemberCount);
    } catch (error) {
      console.error('[SEARCH GROUPS] Error searching groups:', error);
      res.status(500).json({ error: "Failed to search groups" });
    }
  });

  // Get all open groups (public groups available for joining)
  // MUST come before /api/groups/:id to avoid matching "open" as an ID
  app.get("/api/groups/open", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('[OPEN GROUPS] Fetching open groups for user:', userId);
      
      const openGroups = await storage.getOpenGroups(userId);
      console.log('[OPEN GROUPS] Found open groups:', openGroups.length, openGroups.map(g => ({ id: g.id, name: g.name, visibility: g.visibility })));
      
      // Get user's existing join requests to filter out already-requested groups
      const userRequests = await storage.getJoinRequestsByUser(userId);
      const requestedGroupIds = new Set(userRequests.map(r => r.groupId));
      console.log('[OPEN GROUPS] User has requested to join:', requestedGroupIds.size, 'groups');
      
      // Filter out groups that user has already requested to join
      const availableGroups = openGroups.filter(group => !requestedGroupIds.has(group.id));
      console.log('[OPEN GROUPS] Available groups after filtering:', availableGroups.length);
      
      // Include member count for each group to check if it's full
      const groupsWithMemberCount = await Promise.all(
        availableGroups.map(async (group) => {
          const members = await storage.getMembersByGroup(group.id);
          const isFull = group.maxMembers ? members.length >= group.maxMembers : false;
          return {
            ...group,
            memberCount: members.length,
            isFull,
          };
        })
      );
      
      console.log('[OPEN GROUPS] Returning groups with member counts:', groupsWithMemberCount.length);
      res.json(groupsWithMemberCount);
    } catch (error) {
      console.error('[OPEN GROUPS] Error fetching open groups:', error);
      res.status(500).json({ error: "Failed to fetch open groups" });
    }
  });

  app.get("/api/groups/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get group first without side effects
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // AUTHORIZATION CHECK BEFORE ANY MUTATIONS
      const hasAccess = await storage.isUserGroupMember(group.id, userId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Only after authorization, check and update go-live status
      const updatedGroup = await checkAndUpdateGoLiveStatus(req.params.id);
      const finalGroup = updatedGroup || group;
      
      const members = await storage.getMembersByGroup(finalGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === finalGroup.currentCycle)?.id || null;
      
      res.json({
        ...finalGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertGroupSchema.parse(req.body);
      
      // Validate go-live date (max 7 days in advance)
      if (validated.goLiveDate) {
        const goLiveDate = new Date(validated.goLiveDate);
        const now = new Date();
        const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        if (goLiveDate < now) {
          return res.status(400).json({ error: "Go-live date must be in the future" });
        }
        if (goLiveDate > maxDate) {
          return res.status(400).json({ error: "Go-live date cannot be more than 7 days in advance" });
        }
      }
      
      // Add userId to the group (server-controlled, not from request)
      const groupData: GroupCreateInput = { ...validated, userId };
      const group = await storage.createGroup(groupData);
      
      // Automatically add the creator as a member with role 'creator'
      const user = await storage.getUser(userId);
      if (user) {
        const creatorMember = await storage.createMember({
          groupId: group.id,
          userId: userId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Group Creator',
          phone: user.phone || '',
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active',
          role: 'creator',
          canPostInGroup: 1,
          rotationOrder: 1,
        });
        
        // Create contributions for the creator for all cycles
        for (let cycle = 1; cycle <= group.totalCycles; cycle++) {
          await storage.createContribution({
            groupId: group.id,
            memberId: creatorMember.id,
            cycle,
            amount: group.contributionAmount,
            status: 'pending',
          });
        }
      }
      
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/groups/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const updates = insertGroupSchema.partial().parse(req.body);
      
      // userId is already excluded from the schema, so it can't be in updates
      const group = await storage.updateGroup(req.params.id, updates, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Return group with members for frontend cache consistency
      const members = await storage.getMembersByGroup(group.id);
      const currentRecipientId = members.find(m => m.rotationOrder === group.currentCycle)?.id || null;
      
      res.json({
        ...group,
        members,
        currentRecipientId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  // Update group collection date (owner only, pending groups only)
  // NOTE: Collection date is the payment deadline - independent of go-live date
  app.patch("/api/groups/:id/collection-date", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { collectionDate } = req.body;

      if (!collectionDate) {
        return res.status(400).json({ error: "Collection date is required" });
      }

      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group owner can adjust the collection date" });
      }

      if (group.completedAt) {
        return res.status(400).json({ error: "Cannot adjust collection date for completed groups" });
      }

      // Always coerce to Date object and validate
      const dateObj = new Date(collectionDate);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ error: "Invalid collection date format" });
      }

      // Normalize to YYYY-MM-DD string format for consistent storage
      const normalizedDate = dateObj.toISOString().split('T')[0];
      
      // Update ONLY the payment deadline (nextCollectionDate)
      // Do NOT modify startDate or goLiveDate - those are fixed at group creation
      const updatedGroup = await storage.updateGroup(req.params.id, { 
        nextCollectionDate: normalizedDate
      }, userId);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      const members = await storage.getMembersByGroup(updatedGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === updatedGroup.currentCycle)?.id || null;

      res.json({
        ...updatedGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      console.error("[PATCH collection-date] Error:", error);
      res.status(500).json({ error: "Failed to update collection date" });
    }
  });

  // Update schedule visibility (owner only)
  app.patch("/api/groups/:id/schedule-visibility", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const normalizedScheduleVisibility = normalizeBoolean(req.body.scheduleVisibility);
      if (normalizedScheduleVisibility === null) {
        return res.status(400).json({ error: "Schedule visibility must be 0 or 1" });
      }

      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group owner can adjust schedule visibility" });
      }

      const updatedGroup = await storage.updateGroup(req.params.id, { scheduleVisibility: normalizedScheduleVisibility }, userId);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      const members = await storage.getMembersByGroup(updatedGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === updatedGroup.currentCycle)?.id || null;

      res.json({
        ...updatedGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      console.error("[PATCH schedule-visibility] Error:", error);
      res.status(500).json({ error: "Failed to update schedule visibility" });
    }
  });

  // Update recipient visibility (owner only, pending/active groups only)
  app.patch("/api/groups/:id/recipient-visibility", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const normalizedRecipientVisibility = normalizeBoolean(req.body.recipientVisibility);
      if (normalizedRecipientVisibility === null) {
        return res.status(400).json({ error: "Recipient visibility must be 0 or 1" });
      }

      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group owner can adjust recipient visibility" });
      }

      // Only allow changes for pending and active groups
      if (group.status === 'completed') {
        return res.status(400).json({ error: "Cannot adjust recipient visibility for completed groups" });
      }

      const updatedGroup = await storage.updateGroup(req.params.id, { recipientVisibility: normalizedRecipientVisibility }, userId);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      const members = await storage.getMembersByGroup(updatedGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === updatedGroup.currentCycle)?.id || null;

      res.json({
        ...updatedGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      console.error("[PATCH recipient-visibility] Error:", error);
      res.status(500).json({ error: "Failed to update recipient visibility" });
    }
  });

  // Update group contribution amount (owner only, pending groups only)
  app.patch("/api/groups/:id/contribution-amount", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { contributionAmount } = req.body;

      if (!contributionAmount || contributionAmount <= 0) {
        return res.status(400).json({ error: "Valid contribution amount is required" });
      }

      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group owner can adjust the contribution amount" });
      }

      if (group.isLive || group.completedAt) {
        return res.status(400).json({ error: "Cannot adjust contribution amount for active or completed groups" });
      }

      const updatedGroup = await storage.updateGroup(req.params.id, { contributionAmount }, userId);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      const members = await storage.getMembersByGroup(updatedGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === updatedGroup.currentCycle)?.id || null;

      res.json({
        ...updatedGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update contribution amount" });
    }
  });

  // Update group rotation order (owner only, pending groups only)
  app.patch("/api/groups/:id/rotation-order", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { memberOrders } = req.body;

      if (!Array.isArray(memberOrders) || memberOrders.length === 0) {
        return res.status(400).json({ error: "Member orders array is required" });
      }

      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group owner can adjust the rotation order" });
      }

      if (group.isLive || group.completedAt) {
        return res.status(400).json({ error: "Cannot adjust rotation order for active or completed groups" });
      }

      // Fetch all members of this group to validate the request
      const groupMembers = await storage.getMembersByGroup(req.params.id);
      const groupMemberIds = new Set(groupMembers.map(m => m.id));

      // Validate that all memberIds in the request belong to this group
      const requestedMemberIds = new Set(memberOrders.map(o => o.memberId));
      for (const memberId of Array.from(requestedMemberIds)) {
        if (!groupMemberIds.has(memberId)) {
          return res.status(400).json({ error: "All member IDs must belong to this group" });
        }
      }

      // Validate that memberOrders forms a complete permutation (no missing or duplicate members)
      if (requestedMemberIds.size !== groupMembers.length) {
        return res.status(400).json({ error: "Member orders must include all group members exactly once" });
      }

      // Validate rotation order values form a contiguous sequence starting from 1
      const rotationOrders = memberOrders.map(o => o.rotationOrder).sort((a, b) => a - b);
      for (let i = 0; i < rotationOrders.length; i++) {
        if (rotationOrders[i] !== i + 1) {
          return res.status(400).json({ error: "Rotation orders must be a sequence from 1 to N" });
        }
      }

      // Update each member's rotation order (all validations passed)
      for (const { memberId, rotationOrder } of memberOrders) {
        await storage.updateMemberRotationOrder(memberId, rotationOrder);
      }

      const updatedGroup = await storage.getGroup(req.params.id);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      const members = await storage.getMembersByGroup(updatedGroup.id);
      const currentRecipientId = members.find(m => m.rotationOrder === updatedGroup.currentCycle)?.id || null;

      res.json({
        ...updatedGroup,
        members,
        currentRecipientId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update rotation order" });
    }
  });

  // Members endpoints - Require authentication and group membership verification
  // Updated to respect scheduleVisibility setting for non-admin members
  app.get("/api/groups/:groupId/members", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const groupId = req.params.groupId;
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // First check: Is user a member of this group?
      const membership = await storage.getMemberByUserAndGroup(userId, groupId);
      if (!membership) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }
      
      // Second check: Can this user see the member list/schedule?
      // Admins can always see, others need scheduleVisibility = 1
      const isAdmin = group.userId === userId || membership.isAdmin === 1 || membership.role === 'creator';
      const normalizedScheduleVisibility = Number(group.scheduleVisibility ?? 1);
      const canViewSchedule = isAdmin || normalizedScheduleVisibility === 1;
      
      if (!canViewSchedule) {
        return res.status(403).json({ error: "Schedule is hidden for this group" });
      }
      
      const members = await storage.getMembersByGroup(groupId);
      res.json(members);
    } catch (error) {
      console.error("[GET /groups/:groupId/members] Error:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Admin: Update member permissions (toggle canPostInGroup)
  app.patch("/api/groups/:groupId/members/:memberId/permissions", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId, memberId } = req.params;
      const normalizedCanPostInGroup = normalizeBoolean(req.body.canPostInGroup);
      if (normalizedCanPostInGroup === null) {
        return res.status(400).json({ error: "canPostInGroup must be 0 or 1" });
      }
      const canPostInGroup = normalizedCanPostInGroup === 1;
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the actual group owner (via group.userId)
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can modify member permissions" });
      }
      
      // Get members to verify target member exists
      const members = await storage.getMembersByGroup(groupId);
      const currentUserMember = members.find(m => m.userId === userId);
      
      // Verify the target member exists in this group
      const targetMember = members.find(m => m.id === memberId);
      if (!targetMember) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      // Prevent creator from modifying their own permissions
      if (targetMember.userId === userId) {
        return res.status(400).json({ error: "Cannot modify your own permissions" });
      }
      
      const updatedMember = await storage.updateMemberPermissions(memberId, canPostInGroup);
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member permissions" });
    }
  });

  // Admin: Update member admin status (assign co-admins)
  app.patch("/api/groups/:groupId/members/:memberId/admin", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId, memberId } = req.params;
      const normalizedIsAdmin = normalizeBoolean(req.body.isAdmin);
      if (normalizedIsAdmin === null) {
        return res.status(400).json({ error: "isAdmin must be 0 or 1" });
      }
      const isAdmin = normalizedIsAdmin === 1;
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the actual group owner (via group.userId)
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can assign co-admins" });
      }
      
      // Get members to verify target member exists
      const members = await storage.getMembersByGroup(groupId);
      const targetMember = members.find(m => m.id === memberId);
      if (!targetMember) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      // Prevent creator from modifying their own admin status
      if (targetMember.userId === userId) {
        return res.status(400).json({ error: "Cannot modify your own admin status" });
      }
      
      const updatedMember = await storage.updateMemberAdminStatus(memberId, isAdmin);
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member admin status" });
    }
  });

  // Member: Leave group (only before go-live)
  app.delete("/api/groups/:groupId/leave", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Get group and check if user is a member
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Check if group is already live
      if (group.isLive) {
        return res.status(403).json({ error: "Cannot leave a group that has already gone live" });
      }
      
      // Get all members
      const members = await storage.getMembersByGroup(groupId);
      const currentUserMember = members.find(m => m.userId === userId);
      
      if (!currentUserMember) {
        return res.status(403).json({ error: "You are not a member of this group" });
      }
      
      // Prevent creator from leaving
      if (currentUserMember.role === 'creator') {
        return res.status(403).json({ error: "Group creator cannot leave the group. Delete the group instead." });
      }
      
      // Remove the member
      await storage.deleteMember(currentUserMember.id, groupId);
      res.json({ success: true, message: "You have left the group successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave group" });
    }
  });

  // Creator: Delete group (only before go-live)
  app.delete("/api/groups/:groupId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Check if user is the group owner
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can delete the group" });
      }
      
      // Check if group has gone live
      if (group.isLive) {
        return res.status(403).json({ error: "Cannot delete a group after it has gone live" });
      }
      
      // Delete the group
      const success = await storage.deleteGroup(groupId);
      if (!success) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Admin: Delete member from group
  app.delete("/api/groups/:groupId/members/:memberId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId, memberId } = req.params;
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the actual group owner (via group.userId)
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can remove members" });
      }
      
      // Get members to verify target member exists
      const members = await storage.getMembersByGroup(groupId);
      const currentUserMember = members.find(m => m.userId === userId);
      if (!currentUserMember || currentUserMember.role !== 'creator') {
        return res.status(403).json({ error: "Only the group creator can remove members" });
      }
      
      // Verify the target member exists in this group
      const targetMember = members.find(m => m.id === memberId);
      if (!targetMember) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      // Prevent creator from removing themselves
      if (targetMember.userId === userId) {
        return res.status(400).json({ error: "Cannot remove yourself from the group" });
      }
      
      const success = await storage.deleteMember(memberId, groupId);
      if (!success) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  app.post("/api/members", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertMemberSchema.parse(req.body);
      
      // Get the group
      const group = await storage.getGroup(validated.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the actual group owner (via group.userId)
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can add members" });
      }
      
      const member = await storage.createMember(validated);
      
      // Create contributions for all cycles (current and future)
      for (let cycle = group.currentCycle; cycle <= group.totalCycles; cycle++) {
        await storage.createContribution({
          groupId: validated.groupId,
          memberId: member.id,
          cycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
      }
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create member" });
    }
  });
  // ============================================================================
// CONTRIBUTIONS - Get contributions with auto-creation
// ============================================================================

// Get contributions for a group (with optional cycle query parameter)
// AUTO-CREATES contribution records for all members if missing
// This endpoint supports: /api/groups/:groupId/contributions?cycle=N
app.get("/api/groups/:groupId/contributions", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const { groupId } = req.params;
    const cycleParam = req.query.cycle;
    
    console.log(`[GET /contributions] User: ${userId}, Group: ${groupId}, Cycle param: ${cycleParam}`);
    
    // Get the group
    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Verify user is a member of this group
    const actingMember = await storage.getMemberByUserAndGroup(userId, groupId);
    if (!actingMember) {
      // Also check if user is the group owner
      if (group.userId !== userId) {
        return res.status(403).json({ error: "You must be a member of the group to view contributions" });
      }
    }
    
    // Determine which cycle to fetch (default to current cycle)
    const targetCycle = cycleParam ? parseInt(cycleParam as string) : group.currentCycle;
    
    if (isNaN(targetCycle)) {
      return res.status(400).json({ error: "Invalid cycle number" });
    }
    
    console.log(`[GET /contributions] Target cycle: ${targetCycle}`);
    
    // Get all active members
    const members = await storage.getMembersByGroup(groupId);
    console.log(`[GET /contributions] Found ${members.length} members`);
    
    // AUTO-CREATE: Ensure contribution records exist for all active members for this cycle
    for (const member of members) {
      if (member.status !== 'active') continue;
      
      // Check if contribution exists for this member and cycle
      const existingContrib = await storage.getContributionByMemberAndCycle(
        member.id, 
        targetCycle
      );
      
      if (!existingContrib) {
        // Create contribution record
        await storage.createContribution({
          groupId: groupId,
          memberId: member.id,
          cycle: targetCycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
        console.log(`[Auto-Create] Created contribution for member ${member.id} (${member.name}), cycle ${targetCycle}`);
      }
    }
    
    // Now fetch all contributions for this cycle
    const contributions = await storage.getContributionsByGroupAndCycle(groupId, targetCycle);
    console.log(`[GET /contributions] Found ${contributions.length} contributions for cycle ${targetCycle}`);
    
    // Enrich contributions with member and user data
    const enrichedContributions = await Promise.all(
      contributions.map(async (contrib) => {
        const member = members.find(m => m.id === contrib.memberId);
        let user = null;
        if (member?.userId) {
          user = await storage.getUser(member.userId);
        }
        return {
          ...contrib,
          member: member ? {
            id: member.id,
            groupId: member.groupId,
            userId: member.userId,
            name: member.name,
            phone: member.phone,
            avatar: member.avatar,
            joinDate: member.joinDate,
            status: member.status,
            role: member.role,
            isAdmin: member.isAdmin,
            canPostInGroup: member.canPostInGroup,
            rotationOrder: member.rotationOrder,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profileImageUrl: user.profileImageUrl,
              phone: user.phone,
              localBankName: user.localBankName,
              localBankAccountNumber: user.localBankAccountNumber,
              localBankAccountName: user.localBankAccountName,
            } : null
          } : null
        };
      })
    );
    
    res.json(enrichedContributions);
  } catch (error) {
    console.error('[GET /api/groups/:groupId/contributions] Error:', error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

// ============================================================================
// CYCLE STATUS & ADVANCEMENT ENDPOINTS
// ============================================================================

// GET /api/groups/:groupId/cycle-status - Debug endpoint to check cycle advancement status
app.get("/api/groups/:groupId/cycle-status", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const { groupId } = req.params;
    
    console.log(`[GET /cycle-status] Group: ${groupId}`);
    
    // Get the group
    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    const member = await storage.getMemberByUserAndGroup(userId, groupId);
    if (!member && group.userId !== userId) {
      return res.status(403).json({ error: "You must be a member of this group" });
    }
    
    // Get all members
    const members = await storage.getMembersByGroup(groupId);
    const activeMembers = members.filter(m => m.status === 'active');
    
    // Get contributions for current cycle
    const contributions = await storage.getContributionsByGroupAndCycle(groupId, group.currentCycle);
    
    // Calculate stats
    const paidContributions = contributions.filter(c => c.status === 'paid');
    const pendingContributions = contributions.filter(c => c.status === 'pending');
    const overdueContributions = contributions.filter(c => c.status === 'overdue');
    
    // Find members without contribution records
    const membersWithContributions = new Set(contributions.map(c => c.memberId));
    const membersWithoutContributions = activeMembers.filter(m => !membersWithContributions.has(m.id));
    
    // Determine blockers
    const blockers: string[] = [];
    
    if (group.status !== 'active') {
      blockers.push(`Group status is '${group.status}' (must be 'active')`);
    }
    
    if (membersWithoutContributions.length > 0) {
      blockers.push(`${membersWithoutContributions.length} member(s) missing contribution records: ${membersWithoutContributions.map(m => m.name).join(', ')}`);
    }
    
    if (pendingContributions.length > 0) {
      const pendingNames = await Promise.all(
        pendingContributions.map(async (c) => {
          const m = await storage.getMember(c.memberId);
          return m?.name || 'Unknown';
        })
      );
      blockers.push(`${pendingContributions.length} pending payment(s): ${pendingNames.join(', ')}`);
    }
    
    if (overdueContributions.length > 0) {
      const overdueNames = await Promise.all(
        overdueContributions.map(async (c) => {
          const m = await storage.getMember(c.memberId);
          return m?.name || 'Unknown';
        })
      );
      blockers.push(`${overdueContributions.length} overdue payment(s): ${overdueNames.join(', ')}`);
    }
    
    if (group.currentCycle >= group.totalCycles && paidContributions.length === activeMembers.length) {
      blockers.push(`This is the final cycle - group will be marked as completed when advanced`);
    }
    
    // Can advance if all contributions exist and are paid
    const allMembersHaveContributions = membersWithoutContributions.length === 0;
    const allContributionsPaid = contributions.length > 0 && 
      contributions.length === activeMembers.length && 
      contributions.every(c => c.status === 'paid');
    const canAdvance = group.status === 'active' && allMembersHaveContributions && allContributionsPaid;
    
    const response = {
      groupId,
      groupName: group.name,
      groupStatus: group.status,
      currentCycle: group.currentCycle,
      totalCycles: group.totalCycles,
      nextCollectionDate: group.nextCollectionDate,
      memberCount: activeMembers.length,
      contributionsThisCycle: contributions.length,
      paidCount: paidContributions.length,
      pendingCount: pendingContributions.length,
      overdueCount: overdueContributions.length,
      missingContributionRecords: membersWithoutContributions.length,
      canAdvance,
      blockers,
      // Detailed breakdown for debugging
      details: {
        members: activeMembers.map(m => ({
          id: m.id,
          name: m.name,
          rotationOrder: m.rotationOrder,
        })),
        contributions: contributions.map(c => ({
          id: c.id,
          memberId: c.memberId,
          status: c.status,
          datePaid: c.datePaid,
          hasReceipt: Boolean(c.receiptUrl),
        })),
        membersWithoutContributions: membersWithoutContributions.map(m => ({
          id: m.id,
          name: m.name,
        })),
      }
    };
    
    console.log(`[GET /cycle-status] Response:`, JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error('[GET /api/groups/:groupId/cycle-status] Error:', error);
    res.status(500).json({ error: "Failed to fetch cycle status" });
  }
});

// POST /api/groups/:groupId/advance-cycle - Manual cycle advancement (admin only)
app.post("/api/groups/:groupId/advance-cycle", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const { groupId } = req.params;
    const { force } = req.body; // Optional: force advance even with missing contributions
    
    console.log(`[POST /advance-cycle] Group: ${groupId}, Force: ${force}`);
    
    // Get the group
    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    const member = await storage.getMemberByUserAndGroup(userId, groupId);
    const isOwner = group.userId === userId;
    const isCoAdmin = member?.isAdmin === 1;
    const isCreator = member?.role === 'creator';
    if (!isOwner && !isCoAdmin && !isCreator) {
      return res.status(403).json({ error: "Only group owner or admins can advance the cycle" });
    }
    
    // Check group status
    if (group.status !== 'active') {
      return res.status(400).json({ 
        error: `Cannot advance cycle: group status is '${group.status}'`,
        suggestion: group.status === 'pending' ? "Group must be active first. Wait for go-live date or activate manually." : "Group is already completed."
      });
    }
    
    // Get all members and contributions
    const members = await storage.getMembersByGroup(groupId);
    const activeMembers = members.filter(m => m.status === 'active');
    const contributions = await storage.getContributionsByGroupAndCycle(groupId, group.currentCycle);
    
    // Find members without contributions
    const membersWithContributions = new Set(contributions.map(c => c.memberId));
    const membersWithoutContributions = activeMembers.filter(m => !membersWithContributions.has(m.id));
    
    // Auto-create missing contribution records if force mode
    if (membersWithoutContributions.length > 0) {
      if (force) {
        console.log(`[POST /advance-cycle] Force mode: Creating ${membersWithoutContributions.length} missing contribution records`);
        for (const m of membersWithoutContributions) {
          await storage.createContribution({
            groupId,
            memberId: m.id,
            cycle: group.currentCycle,
            amount: group.contributionAmount,
            status: 'paid', // Mark as paid since we're forcing
          });
        }
        // Re-fetch contributions
        const updatedContributions = await storage.getContributionsByGroupAndCycle(groupId, group.currentCycle);
        contributions.length = 0;
        contributions.push(...updatedContributions);
      } else {
        return res.status(400).json({
          error: "Cannot advance: some members are missing contribution records",
          missingMembers: membersWithoutContributions.map(m => ({ id: m.id, name: m.name })),
          suggestion: "Use { \"force\": true } to auto-create and mark these as paid, or manually add contributions."
        });
      }
    }
    
    // Check all contributions are paid
    const unpaidContributions = contributions.filter(c => c.status !== 'paid');
    if (unpaidContributions.length > 0 && !force) {
      const unpaidDetails = await Promise.all(
        unpaidContributions.map(async (c) => {
          const m = await storage.getMember(c.memberId);
          return { memberId: c.memberId, memberName: m?.name || 'Unknown', status: c.status };
        })
      );
      return res.status(400).json({
        error: "Cannot advance: not all contributions are paid",
        unpaidContributions: unpaidDetails,
        suggestion: "Approve all pending payments first, or use { \"force\": true } to mark them as paid and advance."
      });
    }
    
    // Force mode: mark unpaid contributions as paid
    if (force && unpaidContributions.length > 0) {
      console.log(`[POST /advance-cycle] Force mode: Marking ${unpaidContributions.length} contributions as paid`);
      const datePaid = new Date().toISOString().split('T')[0];
      for (const c of unpaidContributions) {
        await storage.updateContributionStatus(c.id, 'paid', datePaid);
      }
    }
    
    // Now advance the cycle
    const currentCycle = group.currentCycle;
    const isLastCycle = currentCycle >= group.totalCycles;
    
    if (isLastCycle) {
      // Mark group as completed
      console.log(`[POST /advance-cycle] Final cycle - marking group as completed`);
      await storage.markGroupAsCompleted(groupId);
      
      return res.json({
        success: true,
        message: "Final cycle completed! Group has been marked as completed.",
        previousCycle: currentCycle,
        groupStatus: 'completed'
      });
    }
    
    // Advance to next cycle
    const nextCycle = currentCycle + 1;
    
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
    
    console.log(`[POST /advance-cycle] Advancing from cycle ${currentCycle} to ${nextCycle}, next collection: ${nextCollectionDate}`);
    
    // Update group
    await storage.updateGroup(groupId, {
      currentCycle: nextCycle,
      nextCollectionDate,
    });
    
    // Delete receipts from completed cycle
    await storage.deleteReceiptsByCycle(groupId, currentCycle);
    
    // Create contributions for next cycle if they don't exist
    const existingNextCycleContributions = await storage.getContributionsByGroupAndCycle(groupId, nextCycle);
    if (existingNextCycleContributions.length === 0) {
      console.log(`[POST /advance-cycle] Creating contribution records for cycle ${nextCycle}`);
      for (const m of activeMembers) {
        await storage.createContribution({
          groupId,
          memberId: m.id,
          cycle: nextCycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
      }
    }
    
    // Get updated group
    const updatedGroup = await storage.getGroup(groupId);
    
    res.json({
      success: true,
      message: `Successfully advanced from cycle ${currentCycle} to cycle ${nextCycle}`,
      previousCycle: currentCycle,
      currentCycle: nextCycle,
      nextCollectionDate,
      newBeneficiary: activeMembers.find(m => m.rotationOrder === nextCycle)?.name || 'TBD',
      group: updatedGroup
    });
    
  } catch (error) {
    console.error('[POST /api/groups/:groupId/advance-cycle] Error:', error);
    res.status(500).json({ error: "Failed to advance cycle" });
  }
});

  // Contributions endpoints - All require authentication and group ownership verification
  app.get("/api/groups/:groupId/contributions/:cycle", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const cycle = parseInt(req.params.cycle);
      if (isNaN(cycle)) {
        return res.status(400).json({ error: "Invalid cycle number" });
      }
      
      // Verify the group belongs to the authenticated user
      const group = await storage.getGroup(req.params.groupId, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const contributions = await storage.getContributionsByGroupAndCycle(
        req.params.groupId,
        cycle
      );
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/contributions", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertContributionSchema.parse(req.body);
      
      // Verify the group belongs to the authenticated user
      const group = await storage.getGroup(validated.groupId, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const contribution = await storage.createContribution(validated);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contribution" });
    }
  });

  app.patch("/api/contributions/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { status, datePaid } = req.body;
      
      if (!status || !['paid', 'pending', 'overdue'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Fetch the contribution first to get the groupId
      const existingContribution = await storage.getContribution(req.params.id);
      if (!existingContribution) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      // Get the group (without user filtering to check authorization separately)
      const group = await storage.getGroup(existingContribution.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Get current cycle recipient to check if user is the beneficiary
      const members = await storage.getMembersByGroup(existingContribution.groupId);
      
      // Check minimum member requirement (3 members) when trying to record a payment
      if (status === 'paid' && members.length < 3) {
        return res.status(400).json({ 
          error: "Minimum 3 members required",
          message: "A group must have at least 3 members before payments can be recorded or contribution cycles can begin."
        });
      }

      // Authorization check: user must be creator, co-admin, or current beneficiary
      const isCreator = group.userId === userId;
      const actingMember = await storage.getMemberByUserAndGroup(userId, existingContribution.groupId);
      const isCoAdmin = actingMember?.isAdmin === 1;
      
      const currentRecipient = members.find(m => m.rotationOrder === group.currentCycle);
      const isBeneficiary = currentRecipient?.userId === userId;

      if (!isCreator && !isCoAdmin && !isBeneficiary) {
        return res.status(403).json({ error: "Only group admins or the current beneficiary can manage payments" });
      }
      
      // Now perform the update
      const contribution = await storage.updateContributionStatus(
        req.params.id,
        status,
        datePaid || null
      );
      
      if (!contribution) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      // If this is a paid contribution, check if it's the first payment for the group
      if (status === 'paid') {
        // Get all contributions for this group
        const allContributions = await storage.getContributionsByGroup(contribution.groupId);
        const paidContributions = allContributions.filter(c => c.status === 'paid');
        
        // If this is the first payment of the first cycle, check if we should activate
        if (paidContributions.length === 1 && contribution.cycle === 1) {
          // Re-query members to get fresh count before checking minimum
          const currentMembers = await storage.getMembersByGroup(contribution.groupId);
          
          // Only activate if we have minimum required members (3+)
          if (currentMembers.length >= 3) {
            // Get group to check current status
            const group = await storage.getGroup(contribution.groupId);
            if (group) {
              // Adjust total cycles to member count if needed (same as scheduled path)
              await storage.adjustCyclesToMemberCount(contribution.groupId);
              
              // Re-query members to get accurate count after adjustment
              const updatedMembers = await storage.getMembersByGroup(contribution.groupId);
              
              // Activate group: set status, mark live, close invites, record timestamp
              await storage.updateGroup(contribution.groupId, {
                adjustedGoLiveDate: new Date(),
                status: 'active',
                isLive: 1,
                visibility: 'closed',  // Close invites when going live
                totalCycles: updatedMembers.length  // Use updated member count
              }, group.userId);
            }
          }
        }
        
        // Check if all contributions for this cycle are paid and advance if needed
        await storage.checkAndAdvanceCycle(contribution.groupId, contribution.cycle);
      }
      
      res.json(contribution);
    } catch (error) {
      console.error('[PATCH /api/contributions/:id] Error updating contribution:', error);
      res.status(500).json({ error: "Failed to update contribution" });
    }
  });

  // Upload payment receipt
  app.post("/api/contributions/:id/receipt", authMiddleware, upload.single('receipt'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const contributionId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Fetch the contribution
      const contribution = await storage.getContribution(contributionId);
      if (!contribution) {
        // Delete uploaded file if contribution not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      // Get the member associated with this contribution
      const member = await storage.getMember(contribution.memberId);
      if (!member) {
        // Delete uploaded file if member not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Member not found" });
      }
      
      // Verify user is a member of this group
      const actingMember = await storage.getMemberByUserAndGroup(userId, contribution.groupId);
      if (!actingMember) {
        // Delete uploaded file if user is not a member
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "You must be a member of the group to upload receipts" });
      }
      
      // Get group to check if user is admin
      const group = await storage.getGroup(contribution.groupId);
      if (!group) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Group not found" });
      }
      
      // BUSINESS CONTEXT: In cooperative savings groups (Ajo/ROSCA), it's common for:
      // - Members to pay the admin in cash and have the admin upload proof
      // - Members to share payment screenshots with admin who uploads on their behalf
      // - Group organizers to collect payments in person and document them centrally
      // This is a trusted, cooperative environment where members explicitly join groups
      // knowing the admin manages financial records.
      //
      // Authorization allows receipt upload if:
      // 1. User is the member who owns this contribution (self-upload)
      // 2. User is the group owner/creator (admin managing on behalf)
      // 3. User is a co-admin of the group (delegated admin authority)
      //
      // NOTE: Consider adding audit logging/notifications in future to notify members
      // when admins upload receipts on their behalf for full transparency.
      const isContributionOwner = member.userId === userId;
      const isGroupOwner = group.userId === userId;
      const isCoAdmin = actingMember.isAdmin === 1;
      
      if (!isContributionOwner && !isGroupOwner && !isCoAdmin) {
        // Delete uploaded file if unauthorized
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "Only the contribution owner or group admins can upload receipts" });
      }
      
      // Delete old receipt if exists
      if (contribution.receiptUrl) {
        const oldPath = path.join(process.cwd(), contribution.receiptUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      // Update contribution with new receipt URL
      const receiptUrl = req.file.path;
      await storage.updateContributionReceipt(contributionId, receiptUrl);
      
      res.json({ receiptUrl, message: "Receipt uploaded successfully" });
    } catch (error) {
      console.error('Receipt upload error:', error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload receipt" });
    }
  });
// ============================================================================
// APPROVE / DECLINE CONTRIBUTIONS
// ============================================================================

// Approve contribution (admin only) - marks as paid
app.patch("/api/contributions/:id/approve", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const contributionId = req.params.id;
    
    console.log(`[APPROVE] User ${userId} approving contribution ${contributionId}`);
    
    // Fetch the contribution
    const contribution = await storage.getContribution(contributionId);
    if (!contribution) {
      return res.status(404).json({ error: "Contribution not found" });
    }
    
    // Get the group
    const group = await storage.getGroup(contribution.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Authorization: must be creator or co-admin
    const isCreator = group.userId === userId;
    const actingMember = await storage.getMemberByUserAndGroup(userId, contribution.groupId);
    const isCoAdmin = actingMember?.isAdmin === 1;
    
    console.log(`[APPROVE] isCreator: ${isCreator}, isCoAdmin: ${isCoAdmin}`);
    
    if (!isCreator && !isCoAdmin) {
      return res.status(403).json({ error: "Only group admins can approve payments" });
    }
    
    // Check minimum member requirement
    const members = await storage.getMembersByGroup(contribution.groupId);
    if (members.length < 3) {
      return res.status(400).json({ 
        error: "Minimum 3 members required",
        message: "A group must have at least 3 members before payments can be approved."
      });
    }
    
    // Update contribution status to paid
    const datePaid = new Date().toISOString().split('T')[0];
    const updatedContribution = await storage.updateContributionStatus(
      contributionId,
      'paid',
      datePaid
    );
    
    if (!updatedContribution) {
      return res.status(404).json({ error: "Failed to update contribution" });
    }
    
    console.log(`[APPROVE] Contribution ${contributionId} approved, status: paid, datePaid: ${datePaid}`);
    
    // Check if all contributions for this cycle are paid and advance if needed
    await storage.checkAndAdvanceCycle(contribution.groupId, contribution.cycle);
    
    // Get member info for response
    const member = await storage.getMember(contribution.memberId);
    
    res.json({ 
      success: true, 
      message: "Payment approved", 
      contribution: {
        ...updatedContribution,
        member
      }
    });
  } catch (error) {
    console.error('[PATCH /api/contributions/:id/approve] Error:', error);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// Decline contribution (admin only) - resets to pending and removes receipt
app.patch("/api/contributions/:id/decline", authMiddleware, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    const contributionId = req.params.id;
    
    console.log(`[DECLINE] User ${userId} declining contribution ${contributionId}`);
    
    // Fetch the contribution
    const contribution = await storage.getContribution(contributionId);
    if (!contribution) {
      return res.status(404).json({ error: "Contribution not found" });
    }
    
    // Get the group
    const group = await storage.getGroup(contribution.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Authorization: must be creator or co-admin
    const isCreator = group.userId === userId;
    const actingMember = await storage.getMemberByUserAndGroup(userId, contribution.groupId);
    const isCoAdmin = actingMember?.isAdmin === 1;
    
    console.log(`[DECLINE] isCreator: ${isCreator}, isCoAdmin: ${isCoAdmin}`);
    
    if (!isCreator && !isCoAdmin) {
      return res.status(403).json({ error: "Only group admins can decline payments" });
    }
    
    // Delete receipt file if exists
    if (contribution.receiptUrl) {
      const receiptPath = path.join(process.cwd(), contribution.receiptUrl);
      if (fs.existsSync(receiptPath)) {
        fs.unlinkSync(receiptPath);
        console.log(`[DECLINE] Deleted receipt file: ${receiptPath}`);
      }
    }
    
    // Reset contribution to pending and clear receipt URL
    await storage.updateContributionStatus(contributionId, 'pending', null);
    await storage.updateContributionReceipt(contributionId, null);
    
    console.log(`[DECLINE] Contribution ${contributionId} declined, reset to pending`);
    
    res.json({ success: true, message: "Payment declined. Member can resubmit." });
  } catch (error) {
    console.error('[PATCH /api/contributions/:id/decline] Error:', error);
    res.status(500).json({ error: "Failed to decline payment" });
  }
});
  // Get payment receipt (only admin, co-admin, and current cycle beneficiary can view)
  app.get("/api/contributions/:id/receipt", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const contributionId = req.params.id;
      
      console.log(`[Receipt View] User ${userId} attempting to view contribution ${contributionId}`);
      
      // Fetch the contribution
      const contribution = await storage.getContribution(contributionId);
      if (!contribution) {
        console.log(`[Receipt View] Contribution ${contributionId} not found`);
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      if (!contribution.receiptUrl) {
        console.log(`[Receipt View] No receipt uploaded for contribution ${contributionId}`);
        return res.status(404).json({ error: "No receipt uploaded" });
      }
      
      // Get group and members to check authorization
      const group = await storage.getGroup(contribution.groupId);
      if (!group) {
        console.log(`[Receipt View] Group ${contribution.groupId} not found`);
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Verify user is a member of this group
      const actingMember = await storage.getMemberByUserAndGroup(userId, contribution.groupId);
      if (!actingMember) {
        console.log(`[Receipt View] User ${userId} is not a member of group ${contribution.groupId}`);
        return res.status(403).json({ error: "You must be a member of the group to view receipts" });
      }
      
      const members = await storage.getMembersByGroup(contribution.groupId);
      const currentRecipient = members.find(m => m.rotationOrder === group.currentCycle);
      
      // Check authorization:
      // 1. All members can view their OWN receipt
      // 2. Admin (group owner), Co-Admin, and Cycle Beneficiary can view ANY receipt
      const isOwnReceipt = actingMember.id === contribution.memberId;
      const isCreator = group.userId === userId;
      const isCoAdmin = actingMember.isAdmin === 1;
      const isBeneficiary = currentRecipient?.userId === userId;
      
      console.log(`[Receipt View] Authorization check - isOwnReceipt: ${isOwnReceipt}, isCreator: ${isCreator}, isCoAdmin: ${isCoAdmin}, isBeneficiary: ${isBeneficiary}`);
      
      if (!isOwnReceipt && !isCreator && !isCoAdmin && !isBeneficiary) {
        console.log(`[Receipt View] User ${userId} not authorized to view receipt`);
        return res.status(403).json({ error: "You can only view your own receipt, or you must be an admin/beneficiary to view others" });
      }
      
      // Send the file
      const filePath = path.join(process.cwd(), contribution.receiptUrl);
      console.log(`[Receipt View] Looking for file at: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`[Receipt View] File not found at ${filePath}`);
        return res.status(404).json({ error: "Receipt file not found" });
      }
      
      console.log(`[Receipt View] Sending file: ${filePath}`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('[Receipt View] Error:', error);
      res.status(500).json({ error: "Failed to retrieve receipt" });
    }
  });

  // Invite Links
  // Create invite link for a group
  app.post("/api/groups/:groupId/invites", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Generate unique token
      const token = crypto.randomUUID();
      
      // Validate using the scratch-built DTO schema (enforces ISO strings)
      const validated = createInviteLinkDTOSchema.parse({
        groupId,
        token,
        createdBy: userId,
        expiresAt: req.body.expiresAt || null,
        maxUses: req.body.maxUses || null,
      });
      
      // Verify the group belongs to the authenticated user
      const group = await storage.getGroup(groupId, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const inviteLink = await storage.createInviteLink(validated);
      
      res.status(201).json(inviteLink);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invite link" });
    }
  });

  // Get all invite links for a group
  app.get("/api/groups/:groupId/invites", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Verify the group belongs to the authenticated user
      const group = await storage.getGroup(groupId, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const inviteLinks = await storage.getInviteLinksByGroup(groupId);
      res.json(inviteLinks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invite links" });
    }
  });

  // Get invite link details (public - no auth required)
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const inviteLink = await storage.getInviteLink(token);
      if (!inviteLink) {
        return res.status(404).json({ error: "Invite link not found" });
      }
      
      // Server-side fail-closed validation: invalid dates are treated as expired
      if (isInviteExpired(inviteLink.expiresAt)) {
        return res.status(410).json({ error: "Invite link has expired" });
      }
      
      if (isInviteMaxedOut(inviteLink.usedCount, inviteLink.maxUses)) {
        return res.status(410).json({ error: "Invite link has reached maximum uses" });
      }
      
      // Get group details
      const group = await storage.getGroup(inviteLink.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Block invites for groups that are already live or completed
      if (group.isLive) {
        return res.status(410).json({ error: "This group is already live and no longer accepting new members" });
      }
      
      if (group.completedAt) {
        return res.status(410).json({ error: "This group has been completed and is no longer accepting new members" });
      }
      
      // Get creator details
      const creator = await storage.getUser(group.userId);
      const creatorName = creator 
        ? (creator.preferredName || `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'Group Admin')
        : 'Group Admin';
      
      res.json({
        inviteLink,
        group: {
          id: group.id,
          name: group.name,
          contributionAmount: group.contributionAmount,
          currency: group.currency,
          frequency: group.frequency,
          goLiveDate: group.goLiveDate,
          totalCycles: group.totalCycles,
        },
        creatorName,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invite link" });
    }
  });

  // Accept invite and join group
  app.post("/api/invites/:token/accept", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { token } = req.params;
      const { name, phone } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone are required" });
      }
      
      const inviteLink = await storage.getInviteLink(token);
      if (!inviteLink) {
        return res.status(404).json({ error: "Invite link not found" });
      }
      
      // Server-side fail-closed validation: invalid dates are treated as expired
      if (isInviteExpired(inviteLink.expiresAt)) {
        return res.status(410).json({ error: "Invite link has expired" });
      }
      
      if (isInviteMaxedOut(inviteLink.usedCount, inviteLink.maxUses)) {
        return res.status(410).json({ error: "Invite link has reached maximum uses" });
      }
      
      // Get group
      const group = await storage.getGroup(inviteLink.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Block joining groups that are already live or completed
      if (group.isLive) {
        return res.status(410).json({ error: "This group is already live and no longer accepting new members" });
      }
      
      if (group.completedAt) {
        return res.status(410).json({ error: "This group has been completed and is no longer accepting new members" });
      }
      
      // Check if user is already a member
      const existingMembers = await storage.getMembersByGroup(group.id);
      const userAlreadyMember = existingMembers.some(m => m.userId === userId);
      if (userAlreadyMember) {
        return res.status(409).json({ error: "You are already a member of this group" });
      }
      
      // Get next rotation order
      const maxRotationOrder = Math.max(...existingMembers.map(m => m.rotationOrder), 0);
      
      // Create member
      const member = await storage.createMember({
        groupId: group.id,
        userId,
        name,
        phone,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        role: 'participant',
        canPostInGroup: 1,
        rotationOrder: maxRotationOrder + 1,
      });
      
      // Create contributions for all cycles
      for (let cycle = group.currentCycle; cycle <= group.totalCycles; cycle++) {
        await storage.createContribution({
          groupId: group.id,
          memberId: member.id,
          cycle,
          amount: group.contributionAmount,
          status: 'pending',
        });
      }
      
      // Increment invite link usage
      await storage.incrementInviteLinkUsage(token);
      
      res.status(201).json({ member, group });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invite" });
    }
  });

  // Delete invite link
  app.delete("/api/groups/:groupId/invites/:inviteId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId, inviteId } = req.params;
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the actual group owner (via group.userId)
      if (group.userId !== userId) {
        return res.status(403).json({ error: "Only the group creator can delete invites" });
      }
      
      const success = await storage.deleteInviteLink(inviteId, groupId);
      if (!success) {
        return res.status(404).json({ error: "Invite link not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invite link" });
    }
  });

  // Messages
  // Send a message (direct or group)
  app.post("/api/groups/:groupId/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Validate message data - ensure direct messages have recipientId and group messages don't
      const { type, recipientId, content } = req.body;
      
      if (type === 'direct' && !recipientId) {
        return res.status(400).json({ error: "Direct messages require a recipientId" });
      }
      if (type === 'group' && recipientId) {
        return res.status(400).json({ error: "Group messages should not have a recipientId" });
      }
      
      const validated = insertMessageSchema.parse({
        type,
        recipientId: recipientId || null,
        content,
        groupId,
        senderId: userId,
      });
      
      // Verify user is a member of the group (owner or participant)
      const isMember = await storage.isUserGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied: not a member of this group" });
      }
      
      // For group messages, check if user has permission to post
      if (validated.type === 'group') {
        const members = await storage.getMembersByGroup(groupId);
        const senderMember = members.find(m => m.userId === userId);
        
        if (senderMember && !senderMember.canPostInGroup) {
          return res.status(403).json({ error: "You do not have permission to post in this group" });
        }
      }
      
      // For direct messages, verify recipient is part of the group
      if (validated.type === 'direct' && validated.recipientId) {
        const isRecipientMember = await storage.isUserGroupMember(groupId, validated.recipientId);
        if (!isRecipientMember) {
          return res.status(400).json({ error: "Recipient is not a member of this group" });
        }
      }
      
      const message = await storage.createMessage(validated);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  // Get direct messages for current user in a group
  app.get("/api/groups/:groupId/messages/direct", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Verify user is a member of the group (owner or participant)
      const isMember = await storage.isUserGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied: not a member of this group" });
      }
      
      const messages = await storage.getDirectMessages(groupId, userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch direct messages" });
    }
  });
  
  // Get group messages
  app.get("/api/groups/:groupId/messages/group", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Verify user is a member of the group (owner or participant)
      const isMember = await storage.isUserGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied: not a member of this group" });
      }
      
      const messages = await storage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group messages" });
    }
  });
  
  // Delete a message (only own messages)
  app.delete("/api/messages/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const success = await storage.deleteMessage(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Message not found or unauthorized" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Get inbox messages for current user
  app.get("/api/inbox", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // CRITICAL: Filter inbox messages by the authenticated user
      const messages = await storage.getInboxMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbox messages" });
    }
  });

  // Request to join an open group
  app.post("/api/groups/:groupId/join-request", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Verify group exists and is open
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      if (group.visibility !== 'open') {
        return res.status(403).json({ error: "This group is not open for join requests" });
      }
      
      // Block joining groups that are already live or completed
      if (group.isLive) {
        return res.status(410).json({ error: "This group is already live and no longer accepting new members" });
      }
      
      if (group.completedAt) {
        return res.status(410).json({ error: "This group has been completed and is no longer accepting new members" });
      }
      
      // Check if user is already a member
      const isMember = await storage.isUserGroupMember(groupId, userId);
      if (isMember) {
        return res.status(409).json({ error: "You are already a member of this group" });
      }
      
      // Check if group is full
      if (group.maxMembers) {
        const members = await storage.getMembersByGroup(groupId);
        if (members.length >= group.maxMembers) {
          return res.status(409).json({ error: "This group is full" });
        }
      }
      
      // Check if there's already a pending request
      const existingRequests = await storage.getJoinRequestsByUser(userId);
      const hasPendingRequest = existingRequests.some(
        r => r.groupId === groupId && r.status === 'pending'
      );
      if (hasPendingRequest) {
        return res.status(409).json({ error: "You already have a pending request for this group" });
      }
      
      // Create join request
      const joinRequest = await storage.createJoinRequest({
        groupId,
        userId,
        status: 'pending',
      });
      
      // Get user info for notification
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Someone';
      
      // Send inbox message to group creator
      await storage.createMessage({
        type: 'inbox',
        senderId: userId,
        recipientId: group.userId,
        groupId: null,
        content: `${userName} has requested to join your group "${group.name}". Please review the request in the Manage Members section.`,
      });
      
      // Send notifications to all co-admins as well
      const members = await storage.getMembersByGroup(groupId);
      const coAdmins = members.filter(m => m.isAdmin === 1 && m.userId && m.userId !== group.userId);
      
      for (const coAdmin of coAdmins) {
        await storage.createMessage({
          type: 'inbox',
          senderId: userId,
          recipientId: coAdmin.userId!,
          groupId: null,
          content: `${userName} has requested to join "${group.name}". As a co-admin, please review the request in the Manage Members section.`,
        });
      }
      
      res.status(201).json(joinRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to create join request" });
    }
  });

  // Get join requests for a group (admin only)
  app.get("/api/groups/:groupId/join-requests", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId } = req.params;
      
      // Verify the group belongs to the authenticated user
      const group = await storage.getGroup(groupId, userId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const joinRequests = await storage.getJoinRequestsByGroup(groupId);
      res.json(joinRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch join requests" });
    }
  });

  // Approve or reject a join request (admin only)
  app.patch("/api/join-requests/:requestId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { requestId } = req.params;
      const { status } = req.body;
      
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      
      // Get the join request
      const joinRequest = await storage.getJoinRequest(requestId);
      
      if (!joinRequest) {
        return res.status(404).json({ error: "Join request not found" });
      }
      
      // Get the group
      const group = await storage.getGroup(joinRequest.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // CRITICAL: Verify the authenticated user is the group creator OR a co-admin
      const isCreator = group.userId === userId;
      let isCoAdmin = false;
      if (!isCreator) {
        const member = await storage.getMemberByUserAndGroup(userId, group.id);
        isCoAdmin = member?.isAdmin === 1;
      }
      
      if (!isCreator && !isCoAdmin) {
        return res.status(403).json({ error: "Only group admins can approve join requests" });
      }
      
      // If approved, check group capacity before adding member
      let updatedRequest;
      if (status === 'approved') {
        const members = await storage.getMembersByGroup(group.id);
        
        // Enforce maxMembers limit
        if (group.maxMembers && members.length >= group.maxMembers) {
          return res.status(409).json({ error: "Group is already full" });
        }
        
        // Update request status
        updatedRequest = await storage.updateJoinRequestStatus(requestId, status);
        
        const requestUser = await storage.getUser(joinRequest.userId);
        const maxRotationOrder = Math.max(...members.map(m => m.rotationOrder), 0);
        
        await storage.createMember({
          groupId: group.id,
          userId: joinRequest.userId,
          name: requestUser ? `${requestUser.firstName || ''} ${requestUser.lastName || ''}`.trim() || requestUser.email || 'New Member' : 'New Member',
          phone: requestUser?.phone || '',
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active',
          role: 'participant',
          canPostInGroup: 1,
          rotationOrder: maxRotationOrder + 1,
        });
        
        // Create contributions for all remaining cycles
        for (let cycle = group.currentCycle; cycle <= group.totalCycles; cycle++) {
          await storage.createContribution({
            groupId: group.id,
            memberId: joinRequest.userId,
            cycle,
            amount: group.contributionAmount,
            status: 'pending',
          });
        }
        
        // Send confirmation message to user
        await storage.createMessage({
          type: 'inbox',
          senderId: userId,
          recipientId: joinRequest.userId,
          groupId: null,
          content: `Your request to join "${group.name}" has been approved! Welcome to the group.`,
        });
        
        // Check if group should go live after adding new member
        await checkAndUpdateGoLiveStatus(group.id);
      } else {
        // Update request status for rejection
        updatedRequest = await storage.updateJoinRequestStatus(requestId, status);
        // Send rejection message
        await storage.createMessage({
          type: 'inbox',
          senderId: userId,
          recipientId: joinRequest.userId,
          groupId: null,
          content: `Your request to join "${group.name}" has been declined.`,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update join request" });
    }
  });

  // ============================================================================
  // Payment Receipts Routes
  // ============================================================================

  // Upload payment receipt
  app.post("/api/receipts", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Validate request body with Zod
      const receiptSchema = schema.insertPaymentReceiptSchema.omit({ uploadedBy: true });
      const validationResult = receiptSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid receipt data", details: validationResult.error });
      }
      
      const { groupId, memberId, cycleNumber, receiptUrl, fileSize } = validationResult.data;
      
      // Verify user is a member of the group
      const isMember = await storage.isUserGroupMember(groupId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Verify the memberId belongs to the same group
      const member = await storage.getMember(memberId);
      if (!member || member.groupId !== groupId) {
        return res.status(400).json({ error: "Invalid member for this group" });
      }
      
      // Verify cycleNumber is valid for the group
      const group = await storage.getGroup(groupId);
      if (!group || cycleNumber < 1 || cycleNumber > group.totalCycles) {
        return res.status(400).json({ error: "Invalid cycle number" });
      }
      
      const receipt = await storage.createPaymentReceipt({
        groupId,
        memberId,
        uploadedBy: userId,
        cycleNumber,
        receiptUrl,
        fileSize,
      });
      
      res.status(201).json(receipt);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      res.status(500).json({ error: "Failed to upload receipt" });
    }
  });

  // Get receipts for a group cycle (beneficiary and admins only)
  app.get("/api/receipts/:groupId/:cycleNumber", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { groupId, cycleNumber } = req.params;
      
      // Get group and members
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const members = await storage.getMembersByGroup(groupId);
      const currentMember = members.find(m => m.userId === userId);
      
      if (!currentMember) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if user is admin or beneficiary of this cycle
      const isAdmin = group.userId === userId || currentMember.isAdmin === 1;
      const beneficiary = members.find(m => m.rotationOrder === parseInt(cycleNumber));
      const isBeneficiary = beneficiary?.userId === userId;
      
      if (!isAdmin && !isBeneficiary) {
        return res.status(403).json({ error: "Only cycle beneficiary and group admins can view receipts" });
      }
      
      const receipts = await storage.getReceiptsByGroupCycle(groupId, parseInt(cycleNumber));
      res.json(receipts);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });

  // ============================================================================
  // Savings Pots Routes
  // ============================================================================

  // Create a new savings pot
  app.post("/api/pots", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Validate request body with Zod
      const potSchema = z.object({
        name: z.string().min(1, "Pot name is required").max(100, "Pot name too long"),
      });
      const validationResult = potSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid pot data", details: validationResult.error });
      }
      
      const { name } = validationResult.data;
      
      // Check if user already has 5 pots (maximum allowed)
      const existingPots = await storage.getSavingsPotsByUser(userId);
      if (existingPots.length >= 5) {
        return res.status(400).json({ error: "Maximum 5 savings pots allowed" });
      }
      
      const pot = await storage.createSavingsPot({
        userId,
        name,
      });
      
      res.status(201).json(pot);
    } catch (error) {
      console.error('Error creating pot:', error);
      res.status(500).json({ error: "Failed to create savings pot" });
    }
  });

  // Get all pots for a user
  app.get("/api/pots", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const pots = await storage.getSavingsPotsByUser(userId);
      res.json(pots);
    } catch (error) {
      console.error('Error fetching pots:', error);
      res.status(500).json({ error: "Failed to fetch savings pots" });
    }
  });

  // Transfer funds to/from a pot
  app.post("/api/pots/:potId/transfer", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { potId } = req.params;
      
      // Validate request body with Zod
      const transferSchema = z.object({
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number with up to 2 decimals"),
        currency: z.enum(['NGN', 'GBP', 'USD', 'EUR']),
        type: z.enum(['deposit', 'withdrawal']),
      });
      const validationResult = transferSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid transfer data", details: validationResult.error });
      }
      
      const { amount, currency, type } = validationResult.data;
      
      // Parse and validate amount is positive
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      
      // Verify pot belongs to authenticated user
      const pot = await storage.getSavingsPot(potId);
      if (!pot) {
        return res.status(404).json({ error: "Pot not found" });
      }
      if (pot.userId !== userId) {
        return res.status(403).json({ error: "Access denied: This pot belongs to another user" });
      }
      
      // Get user's funds
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (type === 'deposit') {
        // Transfer from user funds to pot
        const currentUserFunds = parseFloat(user[`totalFunds${currency}` as keyof typeof user] as string || '0');
        if (currentUserFunds < amountNum) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
        
        // Calculate new balances
        const newUserFunds = currentUserFunds - amountNum;
        const currentPotBalance = parseFloat(pot[`balance${currency}` as keyof typeof pot] as string || '0');
        const newPotBalance = currentPotBalance + amountNum;
        
        // Validate balances won't go negative
        if (newUserFunds < 0 || newPotBalance < 0) {
          return res.status(400).json({ error: "Transfer would result in negative balance" });
        }
        
        // Update user funds
        await storage.updateUserFunds(userId, {
          [`totalFunds${currency}`]: newUserFunds.toFixed(2),
        });
        
        // Update pot balance
        await storage.updatePotBalance(potId, {
          [`balance${currency}`]: newPotBalance.toFixed(2),
        });
      } else {
        // Transfer from pot to user funds
        const currentPotBalance = parseFloat(pot[`balance${currency}` as keyof typeof pot] as string || '0');
        if (currentPotBalance < amountNum) {
          return res.status(400).json({ error: "Insufficient pot balance" });
        }
        
        // Calculate new balances
        const newPotBalance = currentPotBalance - amountNum;
        const currentUserFunds = parseFloat(user[`totalFunds${currency}` as keyof typeof user] as string || '0');
        const newUserFunds = currentUserFunds + amountNum;
        
        // Validate balances won't go negative
        if (newPotBalance < 0 || newUserFunds < 0) {
          return res.status(400).json({ error: "Transfer would result in negative balance" });
        }
        
        // Update pot balance
        await storage.updatePotBalance(potId, {
          [`balance${currency}`]: newPotBalance.toFixed(2),
        });
        
        // Update user funds
        await storage.updateUserFunds(userId, {
          [`totalFunds${currency}`]: newUserFunds.toFixed(2),
        });
      }
      
      // Create transaction record
      const transaction = await storage.createPotTransaction({
        potId,
        userId,
        amount: amountNum.toFixed(2),
        currency,
        type,
      });
      
      // Return updated pot
      const updatedPot = await storage.getSavingsPot(potId);
      res.json({ pot: updatedPot, transaction });
    } catch (error) {
      console.error('Error transferring funds:', error);
      res.status(500).json({ error: "Failed to transfer funds" });
    }
  });

  // Get pot transactions
  app.get("/api/pots/:potId/transactions", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { potId } = req.params;
      
      // Verify pot belongs to user
      const pot = await storage.getSavingsPot(potId);
      if (!pot || pot.userId !== userId) {
        return res.status(404).json({ error: "Pot not found" });
      }
      
      const transactions = await storage.getPotTransactions(potId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Delete a savings pot
  app.delete("/api/pots/:potId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { potId } = req.params;
      
      // Verify pot belongs to user and has zero balance
      const pot = await storage.getSavingsPot(potId);
      if (!pot || pot.userId !== userId) {
        return res.status(404).json({ error: "Pot not found" });
      }
      
      // Check if pot has any balance
      const hasBalance = 
        parseFloat(pot.balanceNGN) > 0 ||
        parseFloat(pot.balanceGBP) > 0 ||
        parseFloat(pot.balanceUSD) > 0 ||
        parseFloat(pot.balanceEUR) > 0;
      
      if (hasBalance) {
        return res.status(400).json({ error: "Cannot delete pot with balance. Please withdraw all funds first." });
      }
      
      const success = await storage.deleteSavingsPot(potId, userId);
      if (!success) {
        return res.status(404).json({ error: "Pot not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pot:', error);
      res.status(500).json({ error: "Failed to delete pot" });
    }
  });

  // Helper function to escape HTML to prevent XSS
  function escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Middleware to handle Open Graph tags for social media sharing
  // This intercepts requests to /invite/:token from social media crawlers
  app.get('/invite/:token', async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|Slackbot|LinkedInBot|TelegramBot/i.test(userAgent);
    
    // Only serve custom HTML for social media crawlers
    if (!isCrawler) {
      return next(); // Let Vite/React handle regular users
    }
    
    try {
      const { token } = req.params;
      const inviteLink = await storage.getInviteLink(token);
      
      if (!inviteLink || isInviteExpired(inviteLink.expiresAt) || isInviteMaxedOut(inviteLink.usedCount, inviteLink.maxUses)) {
        return next(); // Let React handle error states
      }
      
      const group = await storage.getGroup(inviteLink.groupId);
      if (!group) {
        return next();
      }
      
      const creator = await storage.getUser(group.userId);
      const creatorName = creator 
        ? (creator.preferredName || `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'Group Admin')
        : 'Group Admin';
      
      const currencySymbol = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£',
        'EUR': '€',
        'CAD': 'C$',
      }[group.currency] || group.currency;
      
      // Validate protocol and host to prevent header injection
      const protocol = req.protocol === 'https' ? 'https' : 'http';
      const host = (req.get('host') || 'localhost:5000').replace(/[^a-zA-Z0-9\-.:]/g, '');
      
      // Compose strings with RAW values (no pre-escaping to avoid double-encoding issues)
      // Use basic number formatting to avoid locale manipulation
      const ogTitle = `Join ${group.name} on KudiLoop`;
      const ogDescription = `Join KudiLoop, your #1 rotational savings platform. Join ${group.name} organized by ${creatorName}. Contribute ${currencySymbol}${String(group.contributionAmount)} ${group.frequency}. Track contributions, manage members, and build savings together.`;
      const ogUrl = `${protocol}://${host}/invite/${token}`;
      const ogImage = `${protocol}://${host}/og-image.png`;
      
      // Escape ONCE for HTML attribute context - this prevents XSS
      // Escaping only at insertion point avoids double-encoding issues that can break attributes
      const safeOgTitle = escapeHtml(ogTitle);
      const safeOgDescription = escapeHtml(ogDescription);
      const safeOgUrl = escapeHtml(ogUrl);
      const safeOgImage = escapeHtml(ogImage);
      
      // Serve HTML with dynamic meta tags
      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeOgTitle}</title>
    <meta name="description" content="${safeOgDescription}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${safeOgUrl}" />
    <meta property="og:title" content="${safeOgTitle}" />
    <meta property="og:description" content="${safeOgDescription}" />
    <meta property="og:image" content="${safeOgImage}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${safeOgUrl}" />
    <meta property="twitter:title" content="${safeOgTitle}" />
    <meta property="twitter:description" content="${safeOgDescription}" />
    <meta property="twitter:image" content="${safeOgImage}" />
    
    <!-- Redirect to actual app after crawlers fetch meta tags -->
    <meta http-equiv="refresh" content="0;url=/invite/${token}" />
  </head>
  <body>
    <p>Redirecting to KudiLoop...</p>
  </body>
</html>`;
      
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating OG tags:', error);
      next(); // Let React handle errors
    }
  });

  // Get recent activity for authenticated user
  app.get("/api/activity/recent", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const activities: any[] = [];

      // Get user's groups to filter relevant activities
      const userGroups = await storage.getAllGroups(userId);
      const groupIds = userGroups.map((g: any) => g.id);

      if (groupIds.length === 0) {
        return res.json([]);
      }

      // Get recent contributions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch all members for all user's groups to get names
      const allMembers = await Promise.all(
        groupIds.map((groupId: string) => storage.getMembersByGroup(groupId))
      );
      const memberMap = new Map();
      allMembers.flat().forEach((m: any) => memberMap.set(m.id, m));

      // Get recent paid contributions across all user's groups
      for (const groupId of groupIds) {
        const group = userGroups.find((g: any) => g.id === groupId);
        if (!group) continue;

        const contributions = await storage.getContributionsByGroup(groupId);
        const recentPaidContributions = contributions.filter(c => 
          c.status === 'paid' && 
          c.datePaid && 
          new Date(c.datePaid) > thirtyDaysAgo
        );

        recentPaidContributions.forEach(c => {
          const member = memberMap.get(c.memberId);
          // Only add if datePaid exists and is valid
          if (c.datePaid) {
            const timestamp = typeof c.datePaid === 'string' ? c.datePaid : new Date(c.datePaid).toISOString();
            const parsedDate = new Date(timestamp);
            if (!isNaN(parsedDate.getTime())) {
              const amount = typeof c.amount === 'number' ? c.amount : Number(c.amount);
              if (Number.isFinite(amount)) {
                activities.push({
                  id: `contribution-${c.id}`,
                  type: 'contribution',
                  title: 'Payment Received',
                  description: `${member?.name || 'Member'} contributed to ${group.name} - Cycle ${c.cycle}`,
                  amount: amount,
                  currency: group.currency,
                  timestamp: timestamp, // Ensure ISO string
                  groupName: group.name,
                });
              }
            }
          }
        });

        // Get recent members who joined (last 30 days)
        const members = await storage.getMembersByGroup(groupId);
        const recentJoins = members.filter(m => {
          if (!m.joinDate) return false;
          try {
            const joinDate = new Date(m.joinDate);
            return !isNaN(joinDate.getTime()) && joinDate > thirtyDaysAgo;
          } catch {
            return false;
          }
        });

        recentJoins.forEach(m => {
          // Only add if joinDate exists
          if (m.joinDate) {
            const timestamp = typeof m.joinDate === 'string' ? m.joinDate : new Date(m.joinDate).toISOString();
            const parsedDate = new Date(timestamp);
            if (!isNaN(parsedDate.getTime())) {
              activities.push({
                id: `join-${m.id}`,
                type: 'join',
                title: 'New Member Joined',
                description: `${m.name} joined ${group.name}`,
                timestamp: timestamp, // Ensure ISO string
                groupName: group.name,
              });
            }
          }
        });
      }

      // Sort by timestamp (most recent first) and limit to 10 items
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recentActivities = activities.slice(0, 10);

      res.json(recentActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // ============================================================================
  // Affiliate Partner Routes
  // ============================================================================

  // Get all partners (optionally filter by active)
  app.get('/api/partners', authMiddleware, async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const partners = await storage.getPartners(activeOnly);
      res.json(partners);
    } catch (error) {
      console.error('Error fetching partners:', error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Get single partner
  app.get('/api/partners/:id', authMiddleware, async (req, res) => {
    try {
      const partner = await storage.getPartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error('Error fetching partner:', error);
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  // Admin: Create new partner
  app.post('/api/partners', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const partnerData = schema.insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(partnerData);

      // Audit log
      await storage.createAuditEvent({
        actorId: req.user.id,
        action: 'create_partner',
        metadata: {
          targetType: 'partner',
          targetId: partner.id,
          partnerName: partner.name,
          ipAddress: req.ip || 'unknown',
        },
      });

      res.json(partner);
    } catch (error) {
      console.error('Error creating partner:', error);
      res.status(500).json({ error: "Failed to create partner" });
    }
  });

  // Admin: Upload partner logo image
  app.post('/api/partners/:id/upload-logo', authMiddleware, isAdmin, uploadPartnerLogo.single('logo'), async (req: any, res) => {
    try {
      const partnerId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Get current partner to check if it exists
      const partner = await storage.getPartner(partnerId);
      if (!partner) {
        // Delete uploaded file if partner not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Partner not found" });
      }
      
      // Delete old logo if it exists and is a custom upload
      if (partner.logoUrl && (partner.logoUrl.startsWith('uploads/partners/') || partner.logoUrl.startsWith('/uploads/partners/'))) {
        const oldPath = path.join(process.cwd(), partner.logoUrl.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      // Update partner with new logo URL (ensure it starts with /)
      const logoUrl = '/' + req.file.path;
      const updatedPartner = await storage.updatePartner(partnerId, { logoUrl });
      
      // Audit log
      if (req.user?.id) {
        await storage.createAuditEvent({
          actorId: req.user.id,
          action: 'upload_partner_logo',
          metadata: {
            targetType: 'partner',
            targetId: partnerId,
            partnerName: partner.name,
            fileName: req.file.filename,
            ipAddress: req.ip || 'unknown',
          },
        });
      }
      
      res.json({ logoUrl, message: "Partner logo uploaded successfully" });
    } catch (error) {
      console.error('Partner logo upload error:', error);
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      res.status(500).json({ error: "Failed to upload partner logo" });
    }
  });

  // Admin: Update partner
  app.patch('/api/partners/:id', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      console.log('[Partner Update] Request body:', JSON.stringify(req.body));
      console.log('[Partner Update] User:', req.user ? `ID: ${req.user.id}` : 'UNDEFINED');
      
      const updates = schema.insertPartnerSchema.partial().parse(req.body);
      console.log('[Partner Update] Parsed updates:', JSON.stringify(updates));
      
      const partner = await storage.updatePartner(req.params.id, updates);

      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }

      console.log('[Partner Update] Partner updated successfully:', partner.id);

      // Audit log - only if user is defined
      if (req.user?.id) {
        await storage.createAuditEvent({
          actorId: req.user.id,
          action: 'update_partner',
          metadata: {
            targetType: 'partner',
            targetId: partner.id,
            partnerName: partner.name,
            ipAddress: req.ip || 'unknown',
          },
        });
      }

      res.json(partner);
    } catch (error) {
      console.error('Error updating partner:', error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  // Admin: Delete partner
  app.delete('/api/partners/:id', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const partner = await storage.getPartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }

      const deleted = await storage.deletePartner(req.params.id);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete partner" });
      }

      // Audit log
      await storage.createAuditEvent({
        actorId: req.user.id,
        action: 'delete_partner',
        metadata: {
          targetType: 'partner',
          targetId: req.params.id,
          partnerName: partner.name,
          ipAddress: req.ip || 'unknown',
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting partner:', error);
      res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  // Track partner click
  app.post('/api/partners/:id/click', authMiddleware, async (req: any, res) => {
    try {
      const partnerId = req.params.id;
      
      // Verify partner exists
      const partner = await storage.getPartner(partnerId);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }

      const userId = getUserId(req);

      const click = await storage.trackPartnerClick(partnerId, userId);
      res.json({ success: true, clickId: click.id });
    } catch (error) {
      console.error('Error tracking partner click:', error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Admin: Get partner analytics
  app.get('/api/partners/analytics', authMiddleware, isAdmin, async (req: any, res) => {
    try {
      const partnerId = req.query.partnerId as string | undefined;
      const analytics = await storage.getPartnerAnalytics(partnerId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching partner analytics:', error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ============================================================================
  // Push Notifications / Device Tokens
  // ============================================================================

  // Register device token validation schema
  const registerDeviceTokenSchema = z.object({
    token: z.string().min(1, "Token is required").max(500),
    platform: z.enum(['ios', 'android', 'web']),
    deviceName: z.string().max(200).optional().nullable(),
  });

  // Register device token for push notifications
  app.post('/api/device-tokens', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const validated = registerDeviceTokenSchema.parse(req.body);
      
      const deviceToken = await storage.registerDeviceToken({
        userId,
        token: validated.token,
        platform: validated.platform,
        deviceName: validated.deviceName || null,
        isActive: 1,
      });
      
      res.status(201).json(deviceToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid device token data", details: error.errors });
      }
      console.error('Error registering device token:', error);
      res.status(500).json({ error: "Failed to register device token" });
    }
  });

  // Get user's registered devices
  app.get('/api/device-tokens', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tokens = await storage.getDeviceTokensByUser(userId);
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching device tokens:', error);
      res.status(500).json({ error: "Failed to fetch device tokens" });
    }
  });

  // Deactivate device token (logout from device)
  app.delete('/api/device-tokens/:token', authMiddleware, async (req: any, res) => {
    try {
      const { token } = req.params;
      const deactivated = await storage.deactivateDeviceToken(token);
      res.json({ success: deactivated });
    } catch (error) {
      console.error('Error deactivating device token:', error);
      res.status(500).json({ error: "Failed to deactivate device token" });
    }
  });

  // ============================================================================
  // User Settings
  // ============================================================================

  // Get user settings
  app.get('/api/settings', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      let settings = await storage.getUserSettings(userId);
      
      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          theme: 'light',
          inactivityTimeoutEnabled: 1,
          inactivityTimeoutMinutes: 3,
          biometricEnabled: 0,
          pushNotificationsEnabled: 1,
          emailNotificationsEnabled: 1,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.patch('/api/settings', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);

      if (req.body.inactivityTimeoutEnabled !== undefined) {
        const normalized = normalizeBoolean(req.body.inactivityTimeoutEnabled);
        if (normalized === null) {
          return res.status(400).json({ error: "inactivityTimeoutEnabled must be 0 or 1" });
        }
        req.body.inactivityTimeoutEnabled = normalized === 1;
      }
      if (req.body.biometricEnabled !== undefined) {
        const normalized = normalizeBoolean(req.body.biometricEnabled);
        if (normalized === null) {
          return res.status(400).json({ error: "biometricEnabled must be 0 or 1" });
        }
        req.body.biometricEnabled = normalized === 1;
      }
      if (req.body.pushNotificationsEnabled !== undefined) {
        const normalized = normalizeBoolean(req.body.pushNotificationsEnabled);
        if (normalized === null) {
          return res.status(400).json({ error: "pushNotificationsEnabled must be 0 or 1" });
        }
        req.body.pushNotificationsEnabled = normalized === 1;
      }
      if (req.body.emailNotificationsEnabled !== undefined) {
        const normalized = normalizeBoolean(req.body.emailNotificationsEnabled);
        if (normalized === null) {
          return res.status(400).json({ error: "emailNotificationsEnabled must be 0 or 1" });
        }
        req.body.emailNotificationsEnabled = normalized === 1;
      }

      const updates = schema.updateUserSettingsSchema.parse(req.body);
      
      const settings = await storage.updateUserSettings(userId, updates);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      console.error('Error updating settings:', error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============================================================================
  // Data Export
  // ============================================================================

  // Request data export
  app.post('/api/exports', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { exportType } = req.body;
      
      if (!exportType || !['contributions', 'groups', 'all'].includes(exportType)) {
        return res.status(400).json({ error: "Export type must be 'contributions', 'groups', or 'all'" });
      }
      
      // Create export request
      const exportRequest = await storage.createDataExport({
        userId,
        exportType,
        status: 'processing',
      });
      
      // Process export immediately (for now - could be moved to a background job)
      try {
        const contributions = await storage.getContributionHistoryForExport(userId);
        
        // Generate CSV content
        const csvHeaders = ['Group Name', 'Member Name', 'Cycle', 'Amount', 'Currency', 'Status', 'Date Paid', 'Created At'];
        const csvRows = contributions.map(c => [
          `"${c.groupName}"`,
          `"${c.memberName}"`,
          c.cycle,
          c.amount,
          c.currency,
          c.status,
          c.datePaid || '',
          c.createdAt.toISOString(),
        ].join(','));
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        // Save to file
        const fileName = `export_${userId}_${Date.now()}.csv`;
        const filePath = path.join(process.cwd(), 'uploads', 'exports', fileName);
        
        // Ensure directory exists
        const exportDir = path.join(process.cwd(), 'uploads', 'exports');
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, csvContent);
        
        // Update export record
        const updatedExport = await storage.updateDataExport(exportRequest.id, {
          status: 'completed',
          fileName,
          fileUrl: `/api/exports/${exportRequest.id}/download`,
          fileSize: Buffer.byteLength(csvContent, 'utf8'),
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        
        res.status(201).json(updatedExport);
      } catch (processError) {
        console.error('Error processing export:', processError);
        await storage.updateDataExport(exportRequest.id, {
          status: 'failed',
          errorMessage: 'Failed to generate export file',
        });
        res.status(500).json({ error: "Failed to process export" });
      }
    } catch (error) {
      console.error('Error creating export request:', error);
      res.status(500).json({ error: "Failed to create export request" });
    }
  });

  // Get user's export history
  app.get('/api/exports', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exports = await storage.getDataExportsByUser(userId);
      res.json(exports);
    } catch (error) {
      console.error('Error fetching exports:', error);
      res.status(500).json({ error: "Failed to fetch exports" });
    }
  });

  // Download export file
  app.get('/api/exports/:id/download', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const exports = await storage.getDataExportsByUser(userId);
      const exportRecord = exports.find(e => e.id === id);
      
      if (!exportRecord) {
        return res.status(404).json({ error: "Export not found" });
      }
      
      if (exportRecord.status !== 'completed' || !exportRecord.fileName) {
        return res.status(400).json({ error: "Export is not ready for download" });
      }
      
      // Check if expired
      if (exportRecord.expiresAt && new Date(exportRecord.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Export has expired" });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', 'exports', exportRecord.fileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Export file not found" });
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading export:', error);
      res.status(500).json({ error: "Failed to download export" });
    }
  });

  // ============================================================================
  // Notifications
  // ============================================================================

  // Get user's notifications
  app.get('/api/notifications', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getNotificationsByUser(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread-count', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      const notification = await storage.markNotificationAsRead(id, userId);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post('/api/notifications/mark-all-read', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ============================================
  // PUBLIC LEGAL PAGES (No Authentication Required)
  // ============================================

  // Terms of Service - Public HTML page
  app.get('/terms', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - KudiLoop</title>
  <meta name="description" content="KudiLoop Terms of Service - Read our terms and conditions for using the KudiLoop rotational savings platform.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #0f0f0f; color: #e5e5e5; line-height: 1.7; padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #fff; font-size: 32px; margin-bottom: 8px; }
    .updated { color: #9ca3af; font-size: 14px; margin-bottom: 32px; }
    h2 { color: #fff; font-size: 20px; margin: 32px 0 16px; }
    p { margin-bottom: 16px; color: #d1d5db; }
    ul { margin: 16px 0 16px 24px; color: #d1d5db; }
    li { margin-bottom: 8px; }
    strong { color: #fff; }
    a { color: #f97316; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 40px; display: block; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="logo">KudiLoop</a>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: November 2024</p>
    
    <p>Welcome to KudiLoop. By accessing or using our mobile application, you agree to be bound by these Terms of Service. Please read them carefully before using our services.</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By creating an account or using KudiLoop, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <a href="/privacy-policy">Privacy Policy</a>. If you do not agree to these terms, please do not use our services.</p>

    <h2>2. Description of Service</h2>
    <p>KudiLoop is a rotational savings platform inspired by the traditional West African Ajo/ROSCA (Rotating Savings and Credit Association) system. The platform enables users to:</p>
    <ul>
      <li>Create and manage savings groups</li>
      <li>Track contributions and rotation schedules</li>
      <li>Communicate with group members</li>
      <li>Manage multiple savings pots</li>
    </ul>

    <h2>3. Eligibility</h2>
    <p>To use KudiLoop, you must:</p>
    <ul>
      <li>Be at least 18 years of age</li>
      <li>Have the legal capacity to enter into binding contracts</li>
      <li>Provide accurate and complete registration information</li>
      <li>Maintain the security of your account credentials</li>
    </ul>

    <h2>4. User Responsibilities</h2>
    <p>As a user, you agree to:</p>
    <ul>
      <li>Provide accurate information and keep it updated</li>
      <li>Honor your contribution commitments to your savings groups</li>
      <li>Not use the platform for illegal activities or fraud</li>
      <li>Respect other users and maintain appropriate conduct</li>
      <li>Not share your account credentials with others</li>
      <li>Report any suspicious activity or security concerns</li>
    </ul>

    <h2>5. Group Participation</h2>
    <p>When participating in savings groups:</p>
    <ul>
      <li><strong>Commitment:</strong> Joining a group constitutes a commitment to make regular contributions as scheduled</li>
      <li><strong>Payout Order:</strong> The rotation order is determined at group creation and may be adjusted by the group admin</li>
      <li><strong>Disputes:</strong> Group-related disputes should be resolved among group members; KudiLoop facilitates but does not arbitrate</li>
      <li><strong>Leaving Groups:</strong> You may leave pending groups before they go live; leaving active groups may affect other members</li>
    </ul>

    <h2>6. Financial Transactions</h2>
    <p>KudiLoop is a platform for organizing and tracking rotational savings. Please note:</p>
    <ul>
      <li>KudiLoop does not hold or transfer funds directly</li>
      <li>Payments between members are made outside the platform</li>
      <li>Users are responsible for verifying payments and receipts</li>
      <li>KudiLoop is not liable for non-payment or disputes between members</li>
    </ul>

    <h2>7. Intellectual Property</h2>
    <p>All content, features, and functionality of KudiLoop, including but not limited to text, graphics, logos, and software, are the exclusive property of KudiLoop and are protected by copyright, trademark, and other intellectual property laws.</p>

    <h2>8. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, KudiLoop and its affiliates shall not be liable for:</p>
    <ul>
      <li>Any indirect, incidental, special, consequential, or punitive damages</li>
      <li>Loss of profits, data, or other intangible losses</li>
      <li>Damages resulting from unauthorized access to your account</li>
      <li>Actions or omissions of other users</li>
    </ul>

    <h2>9. Termination</h2>
    <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service or for any other reason at our sole discretion. You may also delete your account at any time through the Settings page.</p>

    <h2>10. Changes to Terms</h2>
    <p>We may modify these Terms of Service at any time. We will notify you of significant changes through the app or via email. Your continued use of KudiLoop after changes constitutes acceptance of the modified terms.</p>

    <h2>11. Governing Law</h2>
    <p>These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>

    <h2>12. Contact Information</h2>
    <p>For questions about these Terms of Service, please contact us at:</p>
    <p><a href="mailto:legal@kudiloop.com">legal@kudiloop.com</a></p>
  </div>
</body>
</html>`;
    res.header('Content-Type', 'text/html');
    res.send(html);
  });

  // Privacy Policy - Public HTML page
  app.get('/privacy-policy', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - KudiLoop</title>
  <meta name="description" content="KudiLoop Privacy Policy - Learn how we collect, use, and protect your personal information.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #0f0f0f; color: #e5e5e5; line-height: 1.7; padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #fff; font-size: 32px; margin-bottom: 8px; }
    .updated { color: #9ca3af; font-size: 14px; margin-bottom: 32px; }
    h2 { color: #fff; font-size: 20px; margin: 32px 0 16px; }
    p { margin-bottom: 16px; color: #d1d5db; }
    ul { margin: 16px 0 16px 24px; color: #d1d5db; }
    li { margin-bottom: 8px; }
    strong { color: #fff; }
    a { color: #f97316; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 40px; display: block; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="logo">KudiLoop</a>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: November 2024</p>
    
    <p>At KudiLoop, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information that you provide directly to us, including:</p>
    <ul>
      <li><strong>Account Information:</strong> Name, email address, phone number, and profile photo</li>
      <li><strong>Financial Information:</strong> Bank account details for receiving payouts (encrypted and stored securely)</li>
      <li><strong>Group Data:</strong> Savings group memberships, contribution history, and payment records</li>
      <li><strong>Communication Data:</strong> Messages sent within the app</li>
      <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Provide, maintain, and improve our services</li>
      <li>Process transactions and send related notifications</li>
      <li>Send payment reminders and group updates</li>
      <li>Respond to your comments, questions, and requests</li>
      <li>Monitor and analyze trends, usage, and activities</li>
      <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
      <li>Personalize and improve your experience</li>
    </ul>

    <h2>3. Information Sharing</h2>
    <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
    <ul>
      <li><strong>With Group Members:</strong> Your name and contribution status are visible to other members of your savings groups</li>
      <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our platform</li>
      <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We implement appropriate security measures to protect your personal information, including:</p>
    <ul>
      <li>Encryption of sensitive data in transit and at rest</li>
      <li>Secure password hashing using industry-standard algorithms</li>
      <li>Regular security audits and updates</li>
      <li>Access controls and authentication requirements</li>
    </ul>

    <h2>5. Data Retention</h2>
    <p>We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time through the Settings page.</p>

    <h2>6. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access:</strong> Request a copy of your personal data</li>
      <li><strong>Correction:</strong> Update or correct inaccurate information</li>
      <li><strong>Deletion:</strong> Request permanent deletion of your account and data</li>
      <li><strong>Portability:</strong> Export your contribution history from Settings</li>
    </ul>

    <h2>7. Children's Privacy</h2>
    <p>KudiLoop is not intended for users under 18 years of age. We do not knowingly collect personal information from children.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

    <h2>9. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy or our data practices, please contact us at:</p>
    <p><a href="mailto:privacy@kudiloop.com">privacy@kudiloop.com</a></p>
  </div>
</body>
</html>`;
    res.header('Content-Type', 'text/html');
    res.send(html);
  });

  // Redirect /privacy to /privacy-policy for convenience
  app.get('/privacy', (req, res) => {
    res.redirect(301, '/privacy-policy');
  });

  // SEO: Sitemap.xml - Lists all public pages for search engines
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.BASE_URL || 'https://kudiloop.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  const httpServer = createServer(app);
  return httpServer;
}
