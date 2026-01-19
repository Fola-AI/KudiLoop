# KudiLoop Mobile App Documentation

> **Version:** 1.0.0  
> **Platform:** React Native / Expo  
> **Last Updated:** December 2024

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Navigation & Screens](#2-navigation--screens)
3. [API Endpoints Used](#3-api-endpoints-used)
4. [Hooks & State Management](#4-hooks--state-management)
5. [Components](#5-components)
6. [Data Types & Interfaces](#6-data-types--interfaces)
7. [Authentication](#7-authentication)
8. [Environment & Config](#8-environment--config)

---

## 1. Project Structure

### Root Configuration Files

| File | Description |
|------|-------------|
| `app.json` | Expo configuration: app name, bundle ID, icons, splash screen, permissions |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `babel.config.js` | Babel transpiler configuration |
| `metro.config.js` | Metro bundler configuration |
| `tailwind.config.js` | Tailwind CSS / NativeWind configuration |
| `global.css` | Global CSS styles for NativeWind |
| `eas.json` | EAS Build configuration for iOS/Android |

### `/app` - Screens & Navigation (Expo Router)

```
app/
├── _layout.tsx              # Root layout: Clerk, QueryClient, Auth providers
├── index.tsx                # Entry redirect → /(app)/(tabs)
├── +native-intent.tsx       # Deep link handling
│
├── (auth)/                  # Authentication flow (protected when signed in)
│   ├── _layout.tsx          # Auth stack layout
│   ├── welcome.tsx          # Welcome/onboarding screen
│   ├── sign-in.tsx          # Email/password + OAuth sign in
│   ├── sign-up.tsx          # Account registration
│   ├── forgot-password.tsx  # Password reset flow
│   ├── verify-email.tsx     # Email verification OTP
│   ├── pin-setup.tsx        # Set up app PIN
│   ├── pin-entry.tsx        # PIN re-authentication
│   └── biometric-setup.tsx  # Face ID / Touch ID setup
│
├── (app)/                   # Main app (requires authentication)
│   ├── _layout.tsx          # App layout with auth guard
│   │
│   ├── (tabs)/              # Bottom tab navigation
│   │   ├── _layout.tsx      # Tab bar configuration
│   │   ├── index.tsx        # Home screen (dashboard)
│   │   ├── groups.tsx       # Groups list
│   │   ├── activity.tsx     # Transaction history
│   │   └── profile.tsx      # User profile & settings
│   │
│   ├── group/
│   │   ├── _layout.tsx      # Group stack layout
│   │   ├── create.tsx       # Create new group wizard
│   │   └── [id]/            # Dynamic group routes
│   │       ├── _layout.tsx
│   │       ├── index.tsx    # Group dashboard
│   │       ├── members.tsx  # View all members
│   │       ├── schedule.tsx # Payout schedule
│   │       ├── contribute.tsx # Make contribution
│   │       ├── record-payment.tsx # Record member payment (admin)
│   │       ├── invite.tsx   # Invite members
│   │       ├── add-member.tsx # Add member manually
│   │       └── settings.tsx # Group settings
│   │
│   ├── profile/
│   │   ├── _layout.tsx
│   │   ├── edit.tsx         # Edit profile
│   │   ├── banks.tsx        # Bank accounts
│   │   └── pots.tsx         # Savings pots
│   │
│   ├── notifications.tsx    # Notifications list
│   ├── terms.tsx            # Terms of Service
│   └── privacy.tsx          # Privacy Policy
│
└── join/                    # Invite link handling
    ├── _layout.tsx
    └── [token].tsx          # Join group via invite token
```

### `/components` - Reusable Components

```
components/
├── ui/                      # Core UI components
│   ├── index.ts             # Exports all UI components
│   ├── Avatar.tsx           # User avatar with initials fallback
│   ├── Badge.tsx            # Status badges
│   ├── Button.tsx           # Primary/secondary/ghost buttons
│   ├── Card.tsx             # Card containers
│   ├── Divider.tsx          # Line dividers
│   └── Input.tsx            # Text inputs with validation
│
├── skeletons/               # Loading skeletons
│   ├── index.ts
│   ├── HomeScreenSkeleton.tsx
│   └── GroupsScreenSkeleton.tsx
│
├── AnimatedSplash.tsx       # Animated splash screen
├── CachedDataBadge.tsx      # Shows when viewing cached data
├── ErrorState.tsx           # Error display with retry
├── OfflineBanner.tsx        # Offline indicator banner
└── ReceiptViewerModal.tsx   # View receipt images
```

### `/hooks` - Custom Hooks

```
hooks/
├── api/                     # Data fetching hooks
│   ├── index.ts             # Re-exports all API hooks
│   ├── useActivity.ts       # Recent activity
│   ├── useContributions.ts  # Contribution management
│   ├── useGroups.ts         # Groups CRUD
│   ├── useInvite.ts         # Invite validation
│   ├── useNotifications.ts  # Notifications
│   ├── usePots.ts           # Savings pots
│   └── useUser.ts           # User profile
│
├── useIsMounted.ts          # Safe async state updates
├── useNetworkStatus.ts      # Network connectivity
├── useOfflineMutation.ts    # Offline mutation queue
├── useOnlineSync.ts         # Sync when back online
├── usePushNotifications.ts  # Push notification setup
└── useSessionTimeout.ts     # Session timeout handling
```

### `/services` - API & Storage

```
services/
├── api.ts                   # Axios instance + interceptors
├── queryClient.ts           # React Query configuration
├── secureStorage.ts         # Encrypted storage (PIN, biometric)
└── tokenCache.ts            # Clerk token storage
```

### `/contexts` - React Contexts

```
contexts/
└── AuthContext.tsx          # Authentication state provider
```

### `/store` - Zustand Stores

```
store/
├── index.ts
└── authStore.ts             # Auth state (legacy, mostly unused)
```

### `/types` - TypeScript Types

```
types/
├── index.ts                 # Basic types
└── api.ts                   # API response types
```

### `/theme` - Design System

```
theme/
├── index.ts
├── colors.ts                # Color palette
├── spacing.ts               # Spacing scale
└── typography.ts            # Font styles
```

### `/utils` - Utility Functions

```
utils/
├── index.ts
├── formatCurrency.ts        # Currency formatting
├── haptics.ts               # Haptic feedback helpers
├── logger.ts                # Logging utilities
└── sanitize.ts              # Input sanitization
```

### `/config` - Configuration

```
config/
└── env.ts                   # Environment variables
```

---

## 2. Navigation & Screens

### Tab Navigation (Bottom Bar)

| Tab | Route | File | Description |
|-----|-------|------|-------------|
| Home | `/(app)/(tabs)` | `index.tsx` | Dashboard with balance, groups preview, quick actions |
| Groups | `/(app)/(tabs)/groups` | `groups.tsx` | All user's groups with filters |
| Activity | `/(app)/(tabs)/activity` | `activity.tsx` | Transaction history |
| Profile | `/(app)/(tabs)/profile` | `profile.tsx` | Settings and account management |

### Auth Screens

| Screen | Route | File | Description | Components Used |
|--------|-------|------|-------------|-----------------|
| Welcome | `/(auth)/welcome` | `welcome.tsx` | App intro with sign in/up options | Button |
| Sign In | `/(auth)/sign-in` | `sign-in.tsx` | Email/password + Google/Apple OAuth | Input, Button, Divider |
| Sign Up | `/(auth)/sign-up` | `sign-up.tsx` | Registration with email verification | Input, Button |
| Verify Email | `/(auth)/verify-email` | `verify-email.tsx` | OTP verification | Input, Button |
| Forgot Password | `/(auth)/forgot-password` | `forgot-password.tsx` | Password reset | Input, Button |
| PIN Setup | `/(auth)/pin-setup` | `pin-setup.tsx` | Create 4-digit PIN | Custom PIN pad |
| PIN Entry | `/(auth)/pin-entry` | `pin-entry.tsx` | Re-auth with PIN | Custom PIN pad |
| Biometric Setup | `/(auth)/biometric-setup` | `biometric-setup.tsx` | Enable Face ID/Touch ID | Button |

### Group Screens

| Screen | Route | File | Description | Components Used |
|--------|-------|------|-------------|-----------------|
| Create Group | `/group/create` | `create.tsx` | Multi-step group creation wizard | Card, Button, Input |
| Group Dashboard | `/group/[id]` | `index.tsx` | Group overview with cycle progress | Card, Badge, Avatar |
| Members | `/group/[id]/members` | `members.tsx` | All group members | Avatar, Card |
| Schedule | `/group/[id]/schedule` | `schedule.tsx` | Payout rotation order | Card, Badge |
| Contribute | `/group/[id]/contribute` | `contribute.tsx` | Make a contribution | Button, Card |
| Record Payment | `/group/[id]/record-payment` | `record-payment.tsx` | Admin: mark member as paid | Card, Avatar |
| Invite | `/group/[id]/invite` | `invite.tsx` | Generate & share invite links | Card, Button |
| Add Member | `/group/[id]/add-member` | `add-member.tsx` | Manually add member | Input, Button |
| Settings | `/group/[id]/settings` | `settings.tsx` | Group settings & privacy | Card, Switch |

### Profile Screens

| Screen | Route | File | Description | Components Used |
|--------|-------|------|-------------|-----------------|
| Edit Profile | `/profile/edit` | `edit.tsx` | Update personal info | Input, Button, Avatar |
| Bank Accounts | `/profile/banks` | `banks.tsx` | Manage bank details | Card, Input |
| Savings Pots | `/profile/pots` | `pots.tsx` | View/manage savings pots | Card, Button |

### Other Screens

| Screen | Route | File | Description |
|--------|-------|------|-------------|
| Notifications | `/notifications` | `notifications.tsx` | All notifications |
| Join Group | `/join/[token]` | `[token].tsx` | Join via invite link |
| Terms | `/terms` | `terms.tsx` | Terms of Service |
| Privacy | `/privacy` | `privacy.tsx` | Privacy Policy |

---

## 3. API Endpoints Used

### Authentication

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/auth/clerk-config` | `app/_layout.tsx` | None | `{ publishableKey: string }` | Get Clerk publishable key |
| `GET` | `/api/auth/user` | `contexts/AuthContext.tsx`, `hooks/api/useUser.ts` | None | `User` | Get/create current user |

### User & Profile

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/auth/user` | `hooks/api/useUser.ts` | None | `User` | Get current user |
| `PATCH` | `/api/profile` | `hooks/api/useUser.ts` | `UpdateProfilePayload` | `User` | Update user profile |
| `GET` | `/api/settings` | `hooks/api/useUser.ts` | None | `UserSettings` | Get user settings |
| `PATCH` | `/api/settings` | `hooks/api/useUser.ts` | `Partial<UserSettings>` | `UserSettings` | Update settings |
| `POST` | `/api/users/profile-photo` | `hooks/api/useUser.ts` | `FormData (photo)` | `{ profileImageUrl }` | Upload profile photo |

### Groups

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/groups` | `hooks/api/useGroups.ts` | None | `GroupWithDetails[]` | List user's groups |
| `GET` | `/api/groups/:id` | `hooks/api/useGroups.ts` | None | `GroupWithDetails` | Get single group |
| `POST` | `/api/groups` | `hooks/api/useGroups.ts` | `CreateGroupPayload` | `Group` | Create new group |
| `PATCH` | `/api/groups/:id` | `hooks/api/useGroups.ts` | `Partial<Group>` | `Group` | Update group |
| `DELETE` | `/api/groups/:id` | `hooks/api/useGroups.ts` | None | None | Delete group |

### Group Members

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/groups/:id/members` | `hooks/api/useGroups.ts` | None | `Member[]` | List group members |
| `PATCH` | `/api/groups/:id/members/:memberId` | `hooks/api/useGroups.ts` | `{ rotationOrder }` | `Member` | Update member |
| `PATCH` | `/api/groups/:id/members/:memberId/admin` | `app/(app)/group/[id]/settings.tsx` | None | `Member` | Toggle co-admin status |
| `DELETE` | `/api/groups/:id/members/:memberId` | `app/(app)/group/[id]/settings.tsx` | None | None | Remove member |
| `PUT` | `/api/groups/:id/rotation-order` | `hooks/api/useGroups.ts` | `{ rotationUpdates: [{memberId, rotationOrder}] }` | Success | Bulk update rotation |

### Contributions

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/groups/:id/contributions` | `hooks/api/useGroups.ts` | None | `Contribution[]` | Get all contributions |
| `GET` | `/api/groups/:id/contributions?cycle=N` | `hooks/api/useGroups.ts` | None | `Contribution[]` | Get by cycle |
| `GET` | `/api/contributions/:id` | `hooks/api/useContributions.ts` | None | `Contribution` | Get single contribution |
| `PATCH` | `/api/contributions/:id` | `hooks/api/useContributions.ts` | `{ status, datePaid }` | `Contribution` | Update contribution |
| `POST` | `/api/contributions/:id/receipt` | `hooks/api/useContributions.ts` | `FormData (receipt)` | `{ receiptUrl }` | Upload receipt |

### Invites

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/groups/:id/invites` | `hooks/api/useGroups.ts` | None | `InviteLink[]` | List group invites |
| `POST` | `/api/groups/:id/invites` | `hooks/api/useGroups.ts` | `{ expiresInDays?, maxUses? }` | `InviteLink` | Create invite |
| `DELETE` | `/api/groups/:id/invites/:inviteId` | `hooks/api/useGroups.ts` | None | None | Delete invite |
| `GET` | `/api/invite/:token` | `hooks/api/useInvite.ts` | None | `InviteInfo` | Validate invite (public) |
| `POST` | `/api/invite/:token/join` | `hooks/api/useGroups.ts` | None | `{ groupId, memberId }` | Join via invite |

### Savings Pots

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/pots` | `hooks/api/usePots.ts` | None | `SavingsPot[]` | List user's pots |
| `POST` | `/api/pots` | `hooks/api/usePots.ts` | `{ name }` | `SavingsPot` | Create pot |
| `DELETE` | `/api/pots/:id` | `hooks/api/usePots.ts` | None | None | Delete pot |
| `GET` | `/api/pots/:id/transactions` | `hooks/api/usePots.ts` | None | `PotTransaction[]` | Get pot transactions |
| `POST` | `/api/pots/:id/transfer` | `hooks/api/usePots.ts` | `{ amount, currency, type }` | Transaction | Transfer to/from pot |

### Activity

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/activity/recent` | `hooks/api/useActivity.ts` | None | `Activity[]` | Get recent activity |

### Notifications

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `GET` | `/api/notifications` | `hooks/api/useNotifications.ts` | None | `Notification[]` | Get all notifications |
| `GET` | `/api/notifications/unread-count` | `hooks/api/useNotifications.ts` | None | `{ count }` | Get unread count |
| `PATCH` | `/api/notifications/:id/read` | `hooks/api/useNotifications.ts` | `{}` | None | Mark as read |
| `POST` | `/api/notifications/mark-all-read` | `hooks/api/useNotifications.ts` | `{}` | None | Mark all as read |

### Device Tokens (Push Notifications)

| Method | Endpoint | File | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| `POST` | `/api/device-tokens` | `hooks/usePushNotifications.ts` | `{ token, platform, deviceName }` | None | Register push token |

---

## 4. Hooks & State Management

### API Hooks (`/hooks/api/`)

#### `useUser.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useCurrentUser()` | `GET /auth/user` | `{ data: User, isLoading, error, ... }` |
| `useUserSettings()` | `GET /settings` | `{ data: UserSettings, ... }` |
| `useUpdateProfile()` | `PATCH /profile` | `mutation` for updating profile |
| `useUpdateSettings()` | `PATCH /settings` | `mutation` for updating settings |
| `useUploadProfilePhoto()` | `POST /users/profile-photo` | `mutation` for photo upload |

#### `useGroups.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useGroups()` | `GET /groups` | `{ data: GroupWithDetails[], ... }` |
| `useGroup(id)` | `GET /groups/:id` | `{ data: GroupWithDetails, ... }` |
| `useGroupMembers(groupId)` | `GET /groups/:id/members` | `{ data: Member[], ... }` |
| `useGroupContributions(groupId, cycle?)` | `GET /groups/:id/contributions` | `{ data: Contribution[], ... }` |
| `useCreateGroup()` | `POST /groups` | `mutation` |
| `useUpdateGroup(groupId)` | `PATCH /groups/:id` | `mutation` |
| `useDeleteGroup()` | `DELETE /groups/:id` | `mutation` |
| `useGroupInvites(groupId)` | `GET /groups/:id/invites` | `{ data: InviteLink[], ... }` |
| `useCreateInvite(groupId)` | `POST /groups/:id/invites` | `mutation` |
| `useDeleteInvite(groupId)` | `DELETE /groups/:id/invites/:id` | `mutation` |
| `useJoinGroup()` | `POST /invite/:token/join` | `mutation` |
| `useUpdateRotationOrder(groupId)` | `PUT /groups/:id/rotation-order` | `mutation` |

#### `useContributions.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useContribution(id)` | `GET /contributions/:id` | `{ data: Contribution, ... }` |
| `useUpdateContribution(groupId)` | `PATCH /contributions/:id` | `mutation` |
| `useMarkContributionPaid(groupId)` | `PATCH /contributions/:id` | `mutation` (convenience) |
| `useRevertContribution(groupId)` | `PATCH /contributions/:id` | `mutation` |
| `useUploadReceipt(groupId)` | `POST /contributions/:id/receipt` | `mutation` |
| `useReceiptUrl(contributionId)` | `GET /contributions/:id` | `{ data: { receiptUrl } }` |

#### `usePots.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `usePots()` | `GET /pots` | `{ data: SavingsPot[], ... }` |
| `usePotTransactions(potId)` | `GET /pots/:id/transactions` | `{ data: PotTransaction[], ... }` |
| `useCreatePot()` | `POST /pots` | `mutation` |
| `usePotTransfer(potId)` | `POST /pots/:id/transfer` | `mutation` |
| `useDeletePot()` | `DELETE /pots/:id` | `mutation` |
| `useTransferPot()` | `POST /pots/:id/transfer` | `mutation` (flexible) |

#### `useActivity.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useRecentActivity()` | `GET /activity/recent` | `{ data: Activity[], ... }` |

#### `useInvite.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useInviteInfo(token)` | `GET /invite/:token` | `{ data: InviteInfo, ... }` |

#### `useNotifications.ts`

| Hook | API Call | Returns |
|------|----------|---------|
| `useNotifications()` | `GET /notifications` | `{ data: Notification[], ... }` |
| `useUnreadNotificationCount()` | `GET /notifications/unread-count` | `{ data: number }` |
| `useMarkNotificationRead()` | `PATCH /notifications/:id/read` | `mutation` |
| `useMarkAllNotificationsRead()` | `POST /notifications/mark-all-read` | `mutation` |

### Utility Hooks

#### `useNetworkStatus.ts`

```typescript
function useNetworkStatus(): {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  type: string | null;
}
```

Monitors device network connectivity using `@react-native-community/netinfo`.

#### `usePushNotifications.ts`

```typescript
function usePushNotifications(): {
  expoPushToken: string | null;
  error: string | null;
}
```

Sets up push notifications, requests permissions, registers token with backend.

#### `useSessionTimeout.ts`

```typescript
function useSessionTimeout(options?: {
  enabled?: boolean;
  timeoutMs?: number;
  onTimeout?: () => void;
}): {
  resetTimeout: () => Promise<void>;
  checkTimeout: () => Promise<boolean>;
}
```

Handles session timeout when app is backgrounded. Redirects to PIN entry after timeout.

#### `useOnlineSync.ts`

```typescript
function useOnlineSync(): {
  isOffline: boolean;
}
```

Processes pending offline mutations when device comes back online.

#### `useOfflineMutation.ts`

```typescript
function useOfflineAwareMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    mutationType: string;
    onOfflineQueue?: () => void;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
)
```

Wrapper for mutations that queues actions when offline.

---

## 5. Components

### UI Components (`/components/ui/`)

#### `Avatar`

```typescript
interface AvatarProps {
  source?: string | null;      // Image URL
  name?: string;               // Fallback to initials
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBorder?: boolean;
  borderColor?: string;
}
```

**Used in:** Home screen header, Profile screen, Group member lists, Contribution items

#### `AvatarStack`

```typescript
interface AvatarStackProps {
  avatars?: Array<{ source?: string; name: string }>;
  names?: string[];            // Alternative to avatars array
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  max?: number;                // Max avatars to show (default: 4)
}
```

**Used in:** Group cards (showing members)

#### `Badge`

```typescript
interface BadgeProps {
  children: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;               // Show status dot
}
```

**Used in:** Group status indicators, Contribution status

#### `NotificationBadge`

```typescript
interface NotificationBadgeProps {
  count: number;
  max?: number;                // Default: 99
}
```

**Used in:** Tab bar activity icon

#### `Button`

```typescript
interface ButtonProps extends PressableProps {
  children: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}
```

**Used in:** All screens for primary/secondary actions

#### `Card`

```typescript
interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}
```

**Used in:** Group cards, Stats cards, Settings sections

#### `PressableCard`

```typescript
interface PressableCardProps extends PressableProps {
  variant?: "default" | "elevated" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  haptic?: boolean;
  children: React.ReactNode;
}
```

**Used in:** Clickable card items

#### `Input`

```typescript
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
  maxLength?: number;          // Default: 500
}
```

**Used in:** All forms (sign in, sign up, create group, edit profile)

#### `Divider`

```typescript
interface DividerProps {
  label?: string;              // Optional text in middle
  spacing?: number;            // Default: 16
}
```

**Used in:** Sign in screen ("or continue with")

### Other Components

#### `ErrorState`

```typescript
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}
```

**Used in:** Home screen, Groups screen (error fallback)

#### `OfflineBanner`

Animated banner that appears at top when device goes offline.

**Used in:** Root layout (`app/_layout.tsx`)

#### `ReceiptViewerModal`

Modal for viewing receipt images with zoom capability.

**Used in:** Group dashboard (contribution items)

#### `AnimatedSplash`

Animated splash screen shown after native splash.

**Used in:** Root layout

---

## 6. Data Types & Interfaces

### User

```typescript
interface User {
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
  isAdmin: number;             // 0 or 1
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
  
  // Multi-currency funds
  totalFundsNGN: string;
  totalFundsGBP: string;
  totalFundsUSD: string;
  totalFundsEUR: string;
  
  createdAt: string;
  updatedAt: string;
}
```

### UserSettings

```typescript
interface UserSettings {
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
```

### Group

```typescript
type Currency = 'NGN' | 'GBP' | 'EUR' | 'USD' | 'CAD';
type Frequency = 'weekly' | 'monthly';
type GroupStatus = 'pending' | 'active' | 'completed';
type Visibility = 'open' | 'closed';
type PayoutMedium = 'admin' | 'cycle_receiver';

interface Group {
  id: string;
  userId: string;              // Owner
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
  nextCollectionDate: string;  // YYYY-MM-DD
  startDate: string;
  goLiveDate: string;
  adjustedGoLiveDate?: string;
  isLive: number;              // 0 or 1
  scheduleVisibility: number;  // 0 = hidden, 1 = visible
  recipientVisibility: number; // 0 = hidden, 1 = visible
  completedAt?: string;
  createdAt: string;
}

interface GroupWithDetails extends Group {
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
```

### Member

```typescript
type MemberRole = 'creator' | 'participant';
type MemberStatus = 'active' | 'inactive';

interface Member {
  id: string;
  groupId: string;
  userId?: string;
  name: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  status: MemberStatus;
  role: MemberRole;
  isAdmin: number;             // Co-admin flag (0 or 1)
  canPostInGroup: number;
  rotationOrder: number;       // Which cycle they receive
  
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    phone?: string;
    localBankName?: string;
    localBankAccountNumber?: string;
    localBankAccountName?: string;
  };
}
```

### Contribution

```typescript
type ContributionStatus = 'paid' | 'pending' | 'overdue';

interface Contribution {
  id: string;
  groupId: string;
  memberId: string;
  cycle: number;
  amount: number;
  status: ContributionStatus;
  datePaid?: string;
  receiptUrl?: string;         // Cloudinary URL
  createdAt: string;
  member?: Member;
}
```

### SavingsPot

```typescript
interface SavingsPot {
  id: string;
  userId: string;
  name: string;
  balanceNGN: string;
  balanceGBP: string;
  balanceUSD: string;
  balanceEUR: string;
  createdAt: string;
}

interface PotTransaction {
  id: string;
  potId: string;
  userId: string;
  amount: string;
  currency: 'NGN' | 'GBP' | 'USD' | 'EUR';
  type: 'deposit' | 'withdrawal';
  createdAt: string;
}
```

### InviteLink

```typescript
interface InviteLink {
  id: string;
  groupId: string;
  token: string;
  createdBy: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  createdAt: string;
}

interface InviteInfo {
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
```

### Activity

```typescript
type ActivityType = 
  | 'contribution'
  | 'contribution_made'
  | 'contribution_received'
  | 'payout'
  | 'payout_received'
  | 'group_joined'
  | 'group_created'
  | 'pot_deposit'
  | 'pot_withdrawal';

interface Activity {
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
```

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 
    | 'contribution_reminder' 
    | 'contribution_received' 
    | 'payout_upcoming' 
    | 'payout_received' 
    | 'group_invitation' 
    | 'group_joined' 
    | 'cycle_advanced' 
    | 'message_received' 
    | 'system_announcement';
  channel: 'push' | 'email' | 'in_app';
  title: string;
  body: string;
  metadata: {
    groupId?: string;
    contributionId?: string;
    inviteToken?: string;
    [key: string]: any;
  };
  isRead: number;
  sentAt: string;
  readAt: string | null;
}
```

---

## 7. Authentication

### Overview

KudiLoop uses **Clerk** for authentication combined with a custom backend for user data.

### Authentication Flow

1. **App Launch** (`app/_layout.tsx`)
   - Fetches Clerk publishable key from `/api/auth/clerk-config`
   - Falls back to environment variable if backend unreachable
   - Initializes `ClerkProvider` with `tokenCache` for secure token storage

2. **Sign In/Up** (`app/(auth)/sign-in.tsx`, `sign-up.tsx`)
   - Email/password authentication
   - OAuth (Google, Apple) via Clerk's `useSSO`
   - 2FA support (TOTP, SMS, Email codes)

3. **User Creation/Sync** (`contexts/AuthContext.tsx`)
   - After Clerk authentication, calls `GET /api/auth/user`
   - Backend creates user record if first time
   - Returns full user profile from database

4. **Token Management**
   - Tokens stored securely using `expo-secure-store`
   - Automatic token refresh (every 45s in dev, 50min in prod)
   - Token interceptor adds `Authorization: Bearer <token>` to all API requests
   - 401 responses trigger automatic token refresh and retry

### Token Storage

```typescript
// services/tokenCache.ts
const tokenCache: TokenCache = {
  getToken(key: string): Promise<string | null>;
  saveToken(key: string, value: string): Promise<void>;
  clearToken(key: string): Promise<void>;
}
```

- **iOS:** Keychain
- **Android:** EncryptedSharedPreferences
- **Web:** localStorage (testing only)

### API Authentication

```typescript
// services/api.ts
api.interceptors.request.use(async (config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
```

### AuthContext

```typescript
interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  clerkUser: { id, email, firstName, lastName, imageUrl } | null;
  user: User | null;           // From KudiLoop database
  isLoadingUser: boolean;
  userError: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Local Security

- **PIN:** Stored hashed with device-specific salt using SHA-256
- **Biometric:** Face ID / Touch ID via `expo-local-authentication`
- **Session Timeout:** Configurable (5-15 min) - requires re-auth after backgrounding
- **Brute Force Protection:** 5 failed PIN attempts = 5 minute lockout

---

## 8. Environment & Config

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `https://kudiloop.com` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `dv5up7vpe` |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | `kudiloop_receipts` |
| `EXPO_PUBLIC_ENV` | Environment name | `development`, `staging`, `production` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |
| `EXPO_PUBLIC_STAGING_API_URL` | Staging API URL | `https://staging.kudiloop.com` |

### Configuration Object (`config/env.ts`)

```typescript
interface EnvironmentConfig {
  apiUrl: string;
  clerkPublishableKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  sentryDsn?: string;
  sessionTimeoutMs: number;    // 5-15 minutes
  apiTimeoutMs: number;        // 30 seconds
}
```

### Environment-Specific Settings

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| `apiUrl` | From env var | `https://staging.kudiloop.com` | `https://kudiloop.com` |
| `enableLogging` | `true` | `true` | `false` |
| `sessionTimeoutMs` | 15 minutes | 5 minutes | 5 minutes |
| `apiTimeoutMs` | 30 seconds | 30 seconds | 30 seconds |

### React Query Configuration (`services/queryClient.ts`)

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 24 * 60 * 60 * 1000,     // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst',
  },
  mutations: {
    retry: 2,
    networkMode: 'offlineFirst',
  }
}
```

### Query Keys (`services/queryClient.ts`)

```typescript
const queryKeys = {
  // Auth & User
  user: ['user'],
  settings: ['settings'],
  
  // Groups
  groups: ['groups'],
  group: (id) => ['groups', id],
  groupMembers: (id) => ['groups', id, 'members'],
  groupContributions: (id) => ['groups', id, 'contributions'],
  groupContributionsByCycle: (id, cycle) => ['groups', id, 'contributions', cycle],
  groupInvites: (id) => ['groups', id, 'invites'],
  groupMessages: (id) => ['groups', id, 'messages'],
  
  // Invites
  invite: (token) => ['invite', token],
  
  // Pots
  pots: ['pots'],
  pot: (id) => ['pots', id],
  potTransactions: (id) => ['pots', id, 'transactions'],
  
  // Activity
  recentActivity: ['activity', 'recent'],
  inbox: ['messages', 'inbox'],
  unreadCount: ['messages', 'unread-count'],
};
```

### Theme Colors (`theme/colors.ts`)

```typescript
const colors = {
  primary: { DEFAULT: "#FF6B35", light: "#FF8C42", dark: "#E85A2B" },
  secondary: { DEFAULT: "#14B8A6", light: "#2DD4BF", dark: "#0D9488" },
  success: { DEFAULT: "#22C55E", muted: "rgba(34, 197, 94, 0.12)" },
  warning: { DEFAULT: "#F59E0B", muted: "rgba(245, 158, 11, 0.12)" },
  error: { DEFAULT: "#EF4444", muted: "rgba(239, 68, 68, 0.12)" },
  background: "#0A0A0B",
  card: "#141416",
  cardElevated: "#1C1C1F",
  border: "#27272A",
  text: "#FAFAFA",
  textMuted: "#A1A1AA",
  textSubtle: "#71717A",
  white: "#FFFFFF",
  black: "#000000",
  currency: {
    NGN: "#22C55E",
    GBP: "#6366F1",
    USD: "#14B8A6",
    EUR: "#F59E0B",
    CAD: "#EF4444",
  },
};
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.30 | Development platform |
| `expo-router` | ~6.0.21 | File-based navigation |
| `@clerk/clerk-expo` | ^2.19.14 | Authentication |
| `@tanstack/react-query` | ^5.90.14 | Data fetching & caching |
| `zustand` | ^5.0.9 | State management |
| `axios` | ^1.13.2 | HTTP client |
| `expo-secure-store` | ~15.0.8 | Encrypted storage |
| `expo-notifications` | ^0.32.15 | Push notifications |
| `expo-local-authentication` | ~17.0.8 | Biometric auth |
| `react-native-reanimated` | ~4.1.1 | Animations |
| `nativewind` | ^4.2.1 | Tailwind CSS for RN |

---

## Build Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Build for iOS (EAS)
eas build --platform ios

# Build for Android (EAS)
eas build --platform android
```

---

*This documentation is auto-generated and should be updated as the codebase evolves.*






