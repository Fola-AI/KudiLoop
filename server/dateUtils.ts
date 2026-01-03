/**
 * Server-side date utilities for invite validation
 * Implements fail-closed security: invalid dates are treated as expired
 */

/**
 * Checks if an invite link has expired.
 * Accepts Date objects or ISO strings from database/JSON.
 * Returns true for invalid dates (fail-closed for security).
 */
export function isInviteExpired(expiresAt: any): boolean {
  // No expiration set - link never expires
  if (!expiresAt) return false;
  
  try {
    // Normalize to Date object
    let date: Date;
    if (typeof expiresAt === 'string') {
      date = new Date(expiresAt);
    } else if (expiresAt instanceof Date) {
      date = expiresAt;
    } else {
      // Not a string or Date - fail closed (treat as expired)
      return true;
    }
    
    // Invalid date - fail closed (treat as expired)
    if (isNaN(date.getTime())) {
      return true;
    }
    
    return date < new Date();
  } catch {
    // Any parsing error - fail closed (treat as expired)
    return true;
  }
}

/**
 * Checks if an invite link has reached its usage limit.
 */
export function isInviteMaxedOut(usedCount: number, maxUses: number | null): boolean {
  if (!maxUses) return false;
  return usedCount >= maxUses;
}
