import { Express, Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      dbUser?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        preferredName: string | null;
        profileImageUrl: string | null;
        isAdmin: number;
        status: string;
        clerkUserId: string | null;
      };
    }
  }
}

export async function getOrCreateUserFromClerk(
  clerkUserId: string, 
  primaryEmail: string, 
  allEmails: string[],
  firstName?: string, 
  lastName?: string, 
  profileImageUrl?: string
) {
  let user = await storage.getUserByClerkId(clerkUserId);
  
  if (user) {
    return user;
  }
  
  const uniqueEmails = Array.from(new Set(allEmails.map(e => e.toLowerCase())));
  
  for (const email of uniqueEmails) {
    user = await storage.getUserByEmail(email);
    if (user) {
      console.log(`[Clerk Auth] Found existing user by email: ${email}, linking clerkUserId: ${clerkUserId}`);
      await storage.updateUser(user.id, { clerkUserId });
      return { ...user, clerkUserId };
    }
  }
  
  user = await storage.createUser({
    email: primaryEmail.toLowerCase(),
    firstName: firstName || "",
    lastName: lastName || "",
    profileImageUrl: profileImageUrl || null,
    authProvider: "clerk",
    clerkUserId,
  });
  
  console.log(`[Clerk Auth] Created new user with email: ${primaryEmail}, clerkUserId: ${clerkUserId}`);
  
  await storage.createMessage({
    type: 'inbox',
    senderId: user.id,
    recipientId: user.id,
    groupId: null,
    content: `Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!`,
  });
  
  return user;
}

export const clerkAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    
    if (!auth.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    let user = await storage.getUserByClerkId(auth.userId);
    
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const primaryEmail = clerkUser.emailAddresses.find(
          e => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;
        
        if (!primaryEmail) {
          return res.status(400).json({ error: "No email address found in Clerk account" });
        }
        
        const allEmails = clerkUser.emailAddresses.map(e => e.emailAddress);
        
        user = await getOrCreateUserFromClerk(
          auth.userId,
          primaryEmail,
          allEmails,
          clerkUser.firstName || undefined,
          clerkUser.lastName || undefined,
          clerkUser.imageUrl || undefined
        );
      } catch (clerkError: any) {
        console.error("[Clerk Auth] Failed to fetch Clerk user:", clerkError.message);
        return res.status(401).json({ error: "Failed to verify user identity" });
      }
    }
    
    if (user.status === 'deleted') {
      return res.status(403).json({ error: "This account has been deleted" });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: "This account has been banned" });
    }
    
    req.dbUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: user.preferredName,
      profileImageUrl: user.profileImageUrl,
      isAdmin: user.isAdmin,
      status: user.status,
      clerkUserId: user.clerkUserId,
    };
    
    next();
  } catch (error: any) {
    console.error("[Clerk Auth] Error:", error.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export const optionalClerkAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    
    if (auth.userId) {
      const user = await storage.getUserByClerkId(auth.userId);
      if (user && user.status !== 'deleted' && user.status !== 'banned') {
        req.dbUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          preferredName: user.preferredName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
          status: user.status,
          clerkUserId: user.clerkUserId,
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

export function setupClerkAuth(app: Express) {
  app.get("/api/auth/clerk-config", (req, res) => {
    res.json({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      let user = await storage.getUserByClerkId(auth.userId);
      
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(auth.userId);
          const primaryEmail = clerkUser.emailAddresses.find(
            e => e.id === clerkUser.primaryEmailAddressId
          )?.emailAddress;
          
          if (!primaryEmail) {
            return res.status(400).json({ error: "No email address found in Clerk account" });
          }
          
          const allEmails = clerkUser.emailAddresses.map(e => e.emailAddress);
          
          user = await getOrCreateUserFromClerk(
            auth.userId,
            primaryEmail,
            allEmails,
            clerkUser.firstName || undefined,
            clerkUser.lastName || undefined,
            clerkUser.imageUrl || undefined
          );
        } catch (clerkError: any) {
          console.error("[Clerk Auth] Failed to fetch Clerk user:", clerkError.message);
          return res.status(401).json({ error: "Failed to verify user identity" });
        }
      }
      
      if (user.status === 'deleted') {
        return res.status(403).json({ error: "This account has been deleted" });
      }
      if (user.status === 'banned') {
        return res.status(403).json({ error: "This account has been banned" });
      }
      
      const fullUser = await storage.getUserById(user.id);
      
      res.json({
        id: fullUser?.id,
        email: fullUser?.email,
        firstName: fullUser?.firstName,
        lastName: fullUser?.lastName,
        preferredName: fullUser?.preferredName,
        profileImageUrl: fullUser?.profileImageUrl,
        avatarChoice: fullUser?.avatarChoice,
        gender: fullUser?.gender,
        phone: fullUser?.phone,
        aboutMe: fullUser?.aboutMe,
        isAdmin: fullUser?.isAdmin,
        status: fullUser?.status,
        localBankAccountName: fullUser?.localBankAccountName,
        localBankAccountNumber: fullUser?.localBankAccountNumber,
        localBankName: fullUser?.localBankName,
        localBankSortCode: fullUser?.localBankSortCode,
        internationalBankAccountName: fullUser?.internationalBankAccountName,
        internationalBankAccountNumber: fullUser?.internationalBankAccountNumber,
        internationalBankSwiftCode: fullUser?.internationalBankSwiftCode,
        internationalBankIBAN: fullUser?.internationalBankIBAN,
        totalFundsNGN: fullUser?.totalFundsNGN,
        totalFundsGBP: fullUser?.totalFundsGBP,
        totalFundsUSD: fullUser?.totalFundsUSD,
        totalFundsEUR: fullUser?.totalFundsEUR,
        createdAt: fullUser?.createdAt,
      });
    } catch (error: any) {
      console.error("[Clerk Auth] Get user error:", error.message);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const primaryEmail = clerkUser.emailAddresses.find(
        e => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;
      
      if (!primaryEmail) {
        return res.status(400).json({ error: "No email address found in Clerk account" });
      }
      
      const allEmails = clerkUser.emailAddresses.map(e => e.emailAddress);
      
      const user = await getOrCreateUserFromClerk(
        auth.userId,
        primaryEmail,
        allEmails,
        clerkUser.firstName || undefined,
        clerkUser.lastName || undefined,
        clerkUser.imageUrl || undefined
      );
      
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error: any) {
      console.error("[Clerk Auth] Sync user error:", error.message);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });
  
  console.log("[Clerk Auth] Routes registered");
}
