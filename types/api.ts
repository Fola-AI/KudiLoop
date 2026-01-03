/**
 * TypeScript types matching KudiLoop backend schema
 * These types ensure type safety when working with API responses
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  clerkUserId?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  profileImageUrl?: string;
  avatarChoice?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  phone?: string;
  aboutMe?: string;
  isAdmin: number; // 0 or 1
  status: 'active' | 'restricted' | 'banned' | 'deleted';
  
  // Banking - Local
  localBankAccountName?: string;
  localBankAccountNumber?: string;
  localBankName?: string;
  localBankSortCode?: string;
  
  // Banking - International
  internationalBankAccountName?: string;
  internationalBankAccountNumber?: string;
  internationalBankSwiftCode?: string;
  internationalBankIBAN?: string;
  
  // Multi-currency funds (stored as strings for precision)
  totalFundsNGN: string;
  totalFundsGBP: string;
  totalFundsUSD: string;
  totalFundsEUR: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  inactivityTimeoutEnabled: number;
  inactivityTimeoutMinutes: number;
  biometricEnabled: number;
  pushNotificationsEnabled: number;
  emailNotificationsEnabled: number;
  updatedAt: string;
}

// ============================================
// GROUP TYPES
// ============================================

export type Currency = 'NGN' | 'GBP' | 'EUR' | 'USD' | 'CAD';
export type Frequency = 'weekly' | 'monthly';
export type GroupStatus = 'pending' | 'active' | 'completed';
export type Visibility = 'open' | 'closed';
export type PayoutMedium = 'admin' | 'cycle_receiver';

export interface Group {
  id: string;
  userId: string; // Owner
  name: string;
  contributionAmount: number;
  currency: Currency;
  frequency: Frequency;
  status: GroupStatus;
  visibility: Visibility;
  maxMembers?: number;
  payoutMedium: PayoutMedium;
  currentCycle: number;
  totalCycles: number;
  nextCollectionDate: string; // YYYY-MM-DD
  startDate: string;
  goLiveDate: string;
  adjustedGoLiveDate?: string;
  isLive: number; // 0 or 1
  scheduleVisibility: number;
  recipientVisibility: number;
  completedAt?: string;
  createdAt: string;
}

// Extended group with computed fields
export interface GroupWithDetails extends Group {
  memberCount: number;
  paidCount: number;
  isOwner?: boolean;
  isAdmin?: boolean;
  currentBeneficiary?: Member;
  currentBeneficiaryId?: string;
  currentUserId?: string;
  yourPosition?: number;
  myMembership?: Member;
  description?: string;
  members?: Member[];
}

// ============================================
// MEMBER TYPES
// ============================================

export type MemberRole = 'creator' | 'participant';
export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string;
  groupId: string;
  userId?: string;
  name: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  status: MemberStatus;
  role: MemberRole;
  isAdmin: number; // Co-admin flag
  canPostInGroup: number;
  rotationOrder: number; // Which cycle they receive
  
  // Joined user data (when available)
  // May include bank details depending on the endpoint
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'profileImageUrl'> & {
    phone?: string;
    localBankName?: string;
    localBankAccountNumber?: string;
    localBankAccountName?: string;
    internationalBankName?: string;
    internationalBankAccountNumber?: string;
    internationalBankAccountName?: string;
  };
}

// ============================================
// CONTRIBUTION TYPES
// ============================================

export type ContributionStatus = 'paid' | 'pending' | 'overdue';

export interface Contribution {
  id: string;
  groupId: string;
  memberId: string;
  cycle: number;
  amount: number;
  status: ContributionStatus;
  datePaid?: string;
  receiptUrl?: string; // Cloudinary URL
  createdAt: string;
  
  // Joined data
  member?: Member;
}

// ============================================
// SAVINGS POT TYPES
// ============================================

export interface SavingsPot {
  id: string;
  userId: string;
  name: string;
  balanceNGN: string;
  balanceGBP: string;
  balanceUSD: string;
  balanceEUR: string;
  createdAt: string;
}

export interface PotTransaction {
  id: string;
  potId: string;
  userId: string;
  amount: string;
  currency: Exclude<Currency, 'CAD'>; // CAD not supported for pots
  type: 'deposit' | 'withdrawal';
  createdAt: string;
}

// ============================================
// INVITE TYPES
// ============================================

export interface InviteLink {
  id: string;
  groupId: string;
  token: string;
  createdBy: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  createdAt: string;
}

export interface InviteInfo {
  valid: boolean;
  expired?: boolean;
  usedUp?: boolean;
  group?: {
    id: string;
    name: string;
    currency: Currency;
    contributionAmount: number;
    frequency: Frequency;
    memberCount: number;
    status: GroupStatus;
  };
}

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType = 
  | 'contribution'
  | 'contribution_made'
  | 'contribution_received'
  | 'payout'
  | 'payout_received'
  | 'group_joined'
  | 'group_created'
  | 'pot_deposit'
  | 'pot_withdrawal';

export interface Activity {
  id: string;
  type: ActivityType;
  title?: string;
  description?: string;
  amount?: number;
  currency?: Currency;
  groupId?: string;
  groupName?: string;
  potId?: string;
  potName?: string;
  status?: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// ============================================
// MESSAGE TYPES
// ============================================

export type MessageType = 'direct' | 'group' | 'inbox';

export interface Message {
  id: string;
  groupId?: string;
  senderId: string;
  recipientId?: string;
  type: MessageType;
  content: string;
  createdAt: string;
  
  // Joined data
  sender?: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: Array<{ path: string[]; message: string }>;
}

// ============================================
// CREATE/UPDATE PAYLOADS
// ============================================

export interface CreateGroupPayload {
  name: string;
  description?: string;
  contributionAmount: number;
  currency: Currency;
  frequency: Frequency;
  visibility: Visibility;
  maxMembers?: number;
  payoutMedium: PayoutMedium;
  totalCycles: number;          // Minimum 3
  goLiveDate: string;           // ISO timestamp
  nextCollectionDate: string;   // YYYY-MM-DD
  startDate: string;            // YYYY-MM-DD
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  phone?: string;
  aboutMe?: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  avatarChoice?: string | null; // e.g., "male_1", "female_2", "neutral_3", or null to clear
  localBankAccountName?: string;
  localBankAccountNumber?: string;
  localBankName?: string;
  localBankSortCode?: string;
  internationalBankAccountName?: string;
  internationalBankAccountNumber?: string;
  internationalBankSwiftCode?: string;
  internationalBankIBAN?: string;
}

export interface TransferToPotPayload {
  amount: string; // "100.00" format
  currency: Exclude<Currency, 'CAD'>;
  type: 'deposit' | 'withdrawal';
}

export interface CreateInvitePayload {
  expiresInDays?: number;
  maxUses?: number;
}

// ============================================
// CLOUDINARY TYPES
// ============================================

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}
