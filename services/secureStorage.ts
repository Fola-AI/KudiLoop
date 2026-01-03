import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Secure Storage Service for KudiLoop
 * 
 * Uses expo-secure-store for sensitive data (Keychain on iOS, EncryptedSharedPreferences on Android)
 * - PINs are hashed with device-specific salt before storage
 * - Brute force protection with lockout
 * - Never stores plain text sensitive data
 * - Session timeout tracking
 * - Device ID generation
 */

// Keys for secure storage
const KEYS = {
  PIN_HASH: 'kudiloop_pin_hash',
  PIN_SALT: 'kudiloop_pin_salt',
  BIOMETRIC_ENABLED: 'kudiloop_biometric_enabled',
  LAST_AUTH_TIME: 'kudiloop_last_auth_time',
  DEVICE_ID: 'kudiloop_device_id',
  PIN_ATTEMPTS: 'kudiloop_pin_attempts',
  PIN_LOCKOUT_UNTIL: 'kudiloop_pin_lockout',
} as const;

// Options for maximum security
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'com.kudiloop.app',
  keychainAccessible: Platform.OS === 'ios' 
    ? SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY 
    : undefined,
};

// PIN brute force protection settings
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const secureStorage = {
  /**
   * Store a value securely
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
    } catch (error) {
      if (__DEV__) console.error(`Error storing ${key}:`, error);
      throw new Error('Failed to store secure data');
    }
  },

  /**
   * Get a value securely
   */
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
    } catch (error) {
      if (__DEV__) console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a value
   */
  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
    } catch (error) {
      if (__DEV__) console.error(`Error deleting ${key}:`, error);
    }
  },

  /**
   * Generate or retrieve unique device-specific salt
   * Salt is generated once per device and stored securely
   * This prevents rainbow table attacks and ensures each device has unique hashes
   */
  async getOrCreateSalt(): Promise<string> {
    let salt = await this.get(KEYS.PIN_SALT);
    
    if (!salt) {
      // Generate a random salt unique to this device
      salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}-${Platform.OS}-kudiloop-${Math.random()}`
      );
      await this.set(KEYS.PIN_SALT, salt);
      if (__DEV__) {
        console.log('🔐 Device-specific PIN salt generated');
      }
    }
    
    return salt;
  },

  /**
   * Hash a PIN before storing (never store plain text)
   * Uses SHA-256 with a device-specific salt for security
   */
  async hashPin(pin: string): Promise<string> {
    const salt = await this.getOrCreateSalt();
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${pin}:${salt}`
    );
    return digest;
  },

  /**
   * Store PIN securely (hashed with device-specific salt)
   */
  async setPin(pin: string): Promise<void> {
    const hash = await this.hashPin(pin);
    await this.set(KEYS.PIN_HASH, hash);
    // Reset attempts on new PIN
    await this.delete(KEYS.PIN_ATTEMPTS);
    await this.delete(KEYS.PIN_LOCKOUT_UNTIL);
    if (__DEV__) {
      console.log('🔐 PIN saved securely');
    }
  },

  /**
   * Check if user is locked out due to too many failed attempts
   */
  async isLockedOut(): Promise<{ locked: boolean; remainingMs: number }> {
    const lockoutUntil = await this.get(KEYS.PIN_LOCKOUT_UNTIL);
    
    if (!lockoutUntil) {
      return { locked: false, remainingMs: 0 };
    }
    
    const lockoutTime = parseInt(lockoutUntil, 10);
    const now = Date.now();
    
    if (now < lockoutTime) {
      return { locked: true, remainingMs: lockoutTime - now };
    }
    
    // Lockout expired, clear it
    await this.delete(KEYS.PIN_LOCKOUT_UNTIL);
    await this.delete(KEYS.PIN_ATTEMPTS);
    return { locked: false, remainingMs: 0 };
  },

  /**
   * Record a failed PIN attempt
   * After MAX_PIN_ATTEMPTS failures, user is locked out for LOCKOUT_DURATION_MS
   */
  async recordFailedAttempt(): Promise<{ attemptsRemaining: number; lockedOut: boolean }> {
    const currentAttempts = await this.get(KEYS.PIN_ATTEMPTS);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) + 1 : 1;
    
    await this.set(KEYS.PIN_ATTEMPTS, attempts.toString());
    
    if (attempts >= MAX_PIN_ATTEMPTS) {
      // Lock out the user
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      await this.set(KEYS.PIN_LOCKOUT_UNTIL, lockoutUntil.toString());
      if (__DEV__) {
        console.log('🔐 PIN locked out after too many attempts');
      }
      return { attemptsRemaining: 0, lockedOut: true };
    }
    
    return { attemptsRemaining: MAX_PIN_ATTEMPTS - attempts, lockedOut: false };
  },

  /**
   * Reset failed attempts counter (on successful verification)
   */
  async resetAttempts(): Promise<void> {
    await this.delete(KEYS.PIN_ATTEMPTS);
    await this.delete(KEYS.PIN_LOCKOUT_UNTIL);
  },

  /**
   * Get current number of failed attempts
   */
  async getFailedAttempts(): Promise<number> {
    const attempts = await this.get(KEYS.PIN_ATTEMPTS);
    return attempts ? parseInt(attempts, 10) : 0;
  },

  /**
   * Verify PIN against stored hash with brute force protection
   */
  async verifyPin(pin: string): Promise<{ 
    success: boolean; 
    lockedOut?: boolean; 
    attemptsRemaining?: number;
    lockoutRemainingMs?: number;
  }> {
    // Check if locked out first
    const lockoutStatus = await this.isLockedOut();
    if (lockoutStatus.locked) {
      return { 
        success: false, 
        lockedOut: true, 
        lockoutRemainingMs: lockoutStatus.remainingMs 
      };
    }
    
    const storedHash = await this.get(KEYS.PIN_HASH);
    if (!storedHash) {
      return { success: false };
    }
    
    const inputHash = await this.hashPin(pin);
    const isValid = storedHash === inputHash;
    
    if (isValid) {
      await this.resetAttempts();
      return { success: true };
    } else {
      const attemptResult = await this.recordFailedAttempt();
      return { 
        success: false, 
        lockedOut: attemptResult.lockedOut,
        attemptsRemaining: attemptResult.attemptsRemaining
      };
    }
  },

  /**
   * Check if PIN is set
   */
  async hasPinSet(): Promise<boolean> {
    const hash = await this.get(KEYS.PIN_HASH);
    return hash !== null;
  },

  /**
   * Remove PIN and related data
   */
  async removePin(): Promise<void> {
    await Promise.all([
      this.delete(KEYS.PIN_HASH),
      this.delete(KEYS.PIN_SALT),
      this.delete(KEYS.PIN_ATTEMPTS),
      this.delete(KEYS.PIN_LOCKOUT_UNTIL),
    ]);
    if (__DEV__) {
      console.log('🔐 PIN removed');
    }
  },

  /**
   * Set biometric authentication enabled
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.set(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
    if (__DEV__) {
      console.log(`🔐 Biometric ${enabled ? 'enabled' : 'disabled'}`);
    }
  },

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    const value = await this.get(KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  /**
   * Update last authentication time (for session timeout)
   */
  async updateLastAuthTime(): Promise<void> {
    await this.set(KEYS.LAST_AUTH_TIME, Date.now().toString());
  },

  /**
   * Get last authentication time
   */
  async getLastAuthTime(): Promise<number | null> {
    const value = await this.get(KEYS.LAST_AUTH_TIME);
    return value ? parseInt(value, 10) : null;
  },

  /**
   * Check if session has timed out
   * @param timeoutMs Timeout duration in milliseconds
   */
  async hasSessionTimedOut(timeoutMs: number): Promise<boolean> {
    const lastAuthTime = await this.getLastAuthTime();
    if (!lastAuthTime) return true;
    
    return Date.now() - lastAuthTime > timeoutMs;
  },

  /**
   * Generate or retrieve unique device ID
   * Device ID persists across app reinstalls on iOS (Keychain)
   */
  async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await this.get(KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}-kudiloop`
      );
      await this.set(KEYS.DEVICE_ID, deviceId);
      if (__DEV__) {
        console.log('🔐 Device ID generated');
      }
    }
    
    return deviceId;
  },

  /**
   * Clear all secure storage (for logout/account deletion)
   * Note: Device ID is preserved for re-login
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.delete(KEYS.PIN_HASH),
      this.delete(KEYS.PIN_SALT),
      this.delete(KEYS.BIOMETRIC_ENABLED),
      this.delete(KEYS.LAST_AUTH_TIME),
      this.delete(KEYS.PIN_ATTEMPTS),
      this.delete(KEYS.PIN_LOCKOUT_UNTIL),
      // Don't delete DEVICE_ID - keep for re-login
    ]);
    if (__DEV__) {
      console.log('🔐 Secure storage cleared');
    }
  },

  /**
   * Clear everything including device ID (full reset)
   */
  async clearAllIncludingDevice(): Promise<void> {
    await this.clearAll();
    await this.delete(KEYS.DEVICE_ID);
    if (__DEV__) {
      console.log('🔐 Full secure storage reset');
    }
  },

  /**
   * Get security status for debugging
   */
  async getSecurityStatus(): Promise<{
    hasPinSet: boolean;
    biometricEnabled: boolean;
    hasDeviceId: boolean;
    lastAuthTime: number | null;
    failedAttempts: number;
    isLockedOut: boolean;
  }> {
    const [hasPinSet, biometricEnabled, deviceId, lastAuthTime, failedAttempts, lockoutStatus] = await Promise.all([
      this.hasPinSet(),
      this.isBiometricEnabled(),
      this.get(KEYS.DEVICE_ID),
      this.getLastAuthTime(),
      this.getFailedAttempts(),
      this.isLockedOut(),
    ]);

    return {
      hasPinSet,
      biometricEnabled,
      hasDeviceId: deviceId !== null,
      lastAuthTime,
      failedAttempts,
      isLockedOut: lockoutStatus.locked,
    };
  },
};

export default secureStorage;
