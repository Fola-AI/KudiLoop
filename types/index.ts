export type CurrencyCode = "NGN" | "GBP" | "USD" | "EUR" | "CAD";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  profileImageUrl?: string;
  phone?: string;
  // Multi-currency wallet
  totalFundsNGN: string;
  totalFundsGBP: string;
  totalFundsUSD: string;
  totalFundsEUR: string;
  createdAt: string;
}

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

export interface Group {
  id: string;
  userId: string; // Creator/owner
  name: string;
  contributionAmount: number;
  currency: CurrencyCode;
  frequency: "weekly" | "monthly";
  status: "pending" | "active" | "completed";
  visibility: "open" | "closed";
  maxMembers?: number;
  payoutMedium: "admin" | "cycle_receiver";
  currentCycle: number;
  totalCycles: number;
  nextCollectionDate: string;
  startDate: string;
  goLiveDate: string;
  isLive: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  groupId: string;
  userId?: string;
  name: string;
  phone: string;
  avatar?: string;
  status: "active" | "inactive";
  role: "creator" | "participant";
  isAdmin: boolean;
  rotationOrder: number;
  joinDate: string;
}

export interface Contribution {
  id: string;
  groupId: string;
  memberId: string;
  cycle: number;
  amount: number;
  status: "paid" | "pending" | "overdue";
  datePaid?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "contribution" | "payout" | "pot_deposit" | "pot_withdrawal";
  amount: number;
  currency: CurrencyCode;
  status: "pending" | "completed" | "failed";
  description: string;
  groupId?: string;
  groupName?: string;
  potId?: string;
  potName?: string;
  createdAt: string;
}
