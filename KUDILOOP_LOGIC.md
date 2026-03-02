# KudiLoop Logic (End-to-End)

> **Last Updated:** February 10, 2026

## 1. System Overview

- **Mobile app:** Expo Router + React Native.
- **Backend API:** Express.js with Clerk JWT verification.
- **Database:** Neon PostgreSQL via Drizzle ORM.
- **Storage:** Cloudinary for images (profile photos, receipts, partner assets).
- **Notifications:** Expo Push notifications via `/api/device-tokens`.

## 2. Authentication & User Lifecycle

### App Launch
1. `app/_layout.tsx` requests `/api/auth/clerk-config` for the Clerk publishable key.
2. Falls back to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` if backend is unavailable.
3. Initializes Clerk with secure token storage (`services/tokenCache.ts`).

### Sign-Up / Sign-In
1. User authenticates with Clerk (email/password, OAuth, or magic link).
2. Optional 2FA (TOTP/SMS/email) handled by Clerk.
3. After successful auth, `AuthContext` calls `GET /api/auth/user`.
4. Backend creates or fetches the KudiLoop user record, linking `clerkUserId`.

### Session Management
- Tokens are stored with `expo-secure-store`.
- API requests attach `Authorization: Bearer <token>`.
- 401 responses trigger token refresh + retry.
- Proactive refresh: every 45s in dev / 50min in prod.

### Local Security
- PIN setup and biometric setup are enforced after sign-in.
- Session timeout (5–15 mins) routes users back to PIN/biometric unlock.

## 3. Deep Links & Invite Routing

- **Scheme:** `kudiloop://`
- **Universal links:** `https://kudiloop.com/join/<token>`
- `app/+native-intent.tsx` maps `/invite/:token` URLs to `/join/:token`.
- `app/join/[token].tsx` handles public invite previews and join flow.

## 4. Group Creation Logic

### UI Flow (`app/(app)/group/create.tsx`)
1. **Basic Info:** name, description.
2. **Financials:** currency, contribution amount, frequency, total cycles.
3. **Settings:** visibility, payout method, max members.
4. **Schedule:** go-live date.
5. **Review:** confirm and submit.

### Backend Flow
1. `POST /api/groups` creates a group record.
2. Creator is inserted into `members` with `role='creator'`.
3. Contribution rows are generated for the creator across all cycles.

## 5. Group Participation Logic

### Invites
1. Admin/creator creates an invite: `POST /api/groups/:id/invites`.
2. Public validation: `GET /api/invites/:token`.
3. Join action: `POST /api/invites/:token/accept` with `{ name, phone }`.
4. If not signed in, join flow redirects to sign-in, then returns to `/join/:token`.

### Membership & Roles
- **Creator:** group owner; can manage members, invites, and settings.
- **Co-admin:** `members.isAdmin === 1`; can manage contributions and some settings.
- **Participant:** standard group member.

### Rotation Order
- Rotation order is stored on members (`rotationOrder`).
- Bulk updates use `PUT /api/groups/:id/rotation-order`.

## 6. Contributions & Cycle Logic

### Contributions
- Each cycle has contribution records per member.
- Members mark payments; admins review and approve/decline.
- Receipts are uploaded to Cloudinary via `/api/contributions/:id/receipt`.

### Cycle Advancement
1. Admin triggers `POST /api/groups/:groupId/advance-cycle`.
2. Backend verifies completion and advances `currentCycle`.
3. New contribution records created for next cycle.
4. If final cycle completes, group status becomes `completed`.

## 7. Notifications & Activity

- Push token registration: `POST /api/device-tokens`.
- In-app notifications: `/api/notifications`.
- Unread count drives the Activity tab badge.
- Activity feed: `GET /api/activity/recent`.

## 8. Marketplace & Partners

1. Marketplace tab loads partners: `GET /api/partners`.
2. Partner details: `GET /api/partners/:id`.
3. Click tracking: `POST /api/partners/:id/click`.
4. Admins can create/update partners in `app/(app)/admin/partner/*`.

## 9. Admin Policy (Platform & Group)

### Platform Admin
- Backend checks require:
  - `users.isAdmin === 1`
  - `users.email` matches the admin allowlist in `server/routes.ts`
- Admin UI is under `app/(app)/admin/*`.

### Group Admin
- Creator always has full access to group-level admin actions.
- Co-admins can:
  - Approve/decline contributions
  - Advance cycle
  - Manage invites/members (where allowed)

## 10. Offline & Caching Behavior

- React Query uses `networkMode: 'offlineFirst'`.
- `useOfflineMutation` queues mutations when offline.
- `useOnlineSync` replays queued actions when back online.
- Cached data is persisted to `AsyncStorage`.

## 11. Error Handling & Guard Rails

- Global `ErrorBoundary` + `ErrorState` UI.
- `OfflineBanner` indicates connectivity issues.
- Auth guard in `app/(app)/_layout.tsx` blocks access when signed out.
