import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { secureStorage } from '@/services/secureStorage';
import { useAuth } from '@/contexts/AuthContext';

// Default timeout is 2 minutes (fintech security requirement)
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const TIMEOUT_OPTIONS = [1, 2, 5, 10, 15] as const;

export type TimeoutOption = typeof TIMEOUT_OPTIONS[number];

/**
 * Convert minutes to milliseconds
 */
function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Hook to handle session timeout based on user inactivity
 * 
 * Security Features:
 * - 2-minute default timeout (configurable: 1, 2, 5, 10, 15 minutes)
 * - Tracks app background time - if returns within timeout, show biometric unlock
 * - Tracks foreground inactivity - after timeout, show biometric unlock
 * - Full sign out after extended timeout (2x the normal timeout)
 * 
 * @param options Configuration options
 * @param options.enabled Whether session timeout is enabled (default: true)
 * @param options.onLock Callback when app is locked (shows biometric unlock)
 * @param options.onTimeout Callback when session times out (full sign out)
 */
export function useSessionTimeout(options?: {
  enabled?: boolean;
  onLock?: () => void;
  onTimeout?: () => void;
  isAuthenticating?: boolean;
}) {
  const {
    enabled = true,
    onLock,
    onTimeout,
    isAuthenticating = false,
  } = options || {};

  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(DEFAULT_TIMEOUT_MS);

  // Load timeout setting from secure storage
  useEffect(() => {
    const loadTimeout = async () => {
      const minutes = await secureStorage.getInactivityTimeout();
      setTimeoutMs(minutesToMs(minutes));
    };
    loadTimeout();
  }, []);

  /**
   * Lock the app (show biometric unlock)
   */
  const lockApp = useCallback(async (reason: 'background_timeout' | 'inactivity') => {
    // Don't lock if already on auth screens
    if (pathname?.startsWith('/(auth)')) {
      return;
    }

    const hasPin = await secureStorage.hasPinSet();
    const hasBiometric = await secureStorage.isBiometricEnabled();
    
    if (!hasPin && !hasBiometric) {
      // No security set up - don't lock
      return;
    }

    if (__DEV__) {
      console.log(`🔐 Locking app - reason: ${reason}`);
    }
    
    setIsLocked(true);
    await secureStorage.setAppLocked(true);
    onLock?.();
    
    // Navigate to biometric unlock screen
    router.replace({
      pathname: '/(auth)/biometric-unlock',
      params: { reason },
    } as any);
  }, [pathname, router, onLock]);

  /**
   * Force sign out (after extended timeout or too many failed attempts)
   */
  const forceSignOut = useCallback(async () => {
    if (__DEV__) {
      console.log('🔐 Force sign out due to extended timeout');
    }
    
    await secureStorage.clearAll();
    await secureStorage.setAppLocked(false);
    onTimeout?.();
    await signOut();
    
    router.replace('/(auth)/welcome');
  }, [router, signOut, onTimeout]);

  /**
   * Register user activity to reset the inactivity timer
   */
  const registerActivity = useCallback(() => {
    if (isAuthenticating) {
      return;
    }
    lastActivityTime.current = Date.now();
    
    // Clear and restart the inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    if (enabled && appState.current === 'active' && !isLocked) {
      inactivityTimer.current = setTimeout(async () => {
        await lockApp('inactivity');
      }, timeoutMs);
    }
  }, [enabled, timeoutMs, isLocked, lockApp, isAuthenticating]);

  /**
   * Handle app state changes (foreground/background)
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (!enabled) return;

    if (isAuthenticating) {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
          inactivityTimer.current = null;
        }
      }

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        backgroundTime.current = null;
      }

      appState.current = nextAppState;
      return;
    }

    // App going to background
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      backgroundTime.current = Date.now();
      await secureStorage.setAppBackgroundTime();
      
      // Clear the inactivity timer when backgrounded
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      
      await secureStorage.updateLastAuthTime();
      
      if (__DEV__) {
        console.log('🔐 App backgrounded, timers paused');
      }
    }

    // App coming to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      const bgTime = await secureStorage.getAppBackgroundTime();
      
      if (bgTime) {
        const elapsed = Date.now() - bgTime;
        
        if (__DEV__) {
          console.log(`🔐 App foregrounded after ${Math.round(elapsed / 1000)}s (timeout: ${timeoutMs / 1000}s)`);
        }
        
        // Check if we should force sign out (2x the normal timeout)
        const extendedTimeout = timeoutMs * 2;
        
        if (elapsed > extendedTimeout) {
          // Extended timeout - force sign out
          await forceSignOut();
        } else if (elapsed > timeoutMs) {
          // Normal timeout - show biometric unlock
          if (!pathname?.startsWith('/(auth)')) {
            await lockApp('background_timeout');
          }
        } else {
          // Within timeout - just restart activity timer
          registerActivity();
        }
        
        // Clear background time
        await secureStorage.clearAppBackgroundTime();
      }
      
      backgroundTime.current = null;
    }

    appState.current = nextAppState;
  }, [enabled, timeoutMs, pathname, lockApp, forceSignOut, registerActivity, isAuthenticating]);

  // Set up app state listener
  useEffect(() => {
    if (!enabled) return;
    if (isAuthenticating) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check if app was locked before
    const checkLockedState = async () => {
      const wasLocked = await secureStorage.isAppLocked();
      if (wasLocked && !pathname?.startsWith('/(auth)')) {
        await lockApp('background_timeout');
      } else {
        // Start the inactivity timer
        registerActivity();
      }
    };
    
    checkLockedState();
    
    return () => {
      subscription.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [enabled, handleAppStateChange, registerActivity, lockApp, pathname, isAuthenticating]);

  // Reset activity on navigation changes
  useEffect(() => {
    if (enabled && !pathname?.startsWith('/(auth)') && !isLocked && !isAuthenticating) {
      registerActivity();
    }
  }, [pathname, enabled, isLocked, isAuthenticating, registerActivity]);

  /**
   * Manually reset the session timeout
   * Call this after successful authentication
   */
  const resetTimeout = useCallback(async () => {
    backgroundTime.current = null;
    setIsLocked(false);
    await secureStorage.setAppLocked(false);
    await secureStorage.clearAppBackgroundTime();
    await secureStorage.updateLastAuthTime();
    registerActivity();
    
    if (__DEV__) {
      console.log('🔐 Session timeout reset');
    }
  }, [registerActivity]);

  /**
   * Unlock the app (call after successful biometric/PIN auth)
   */
  const unlockApp = useCallback(async () => {
    setIsLocked(false);
    await secureStorage.setAppLocked(false);
    await secureStorage.clearAppBackgroundTime();
    await secureStorage.updateLastAuthTime();
    await secureStorage.resetBiometricFailedAttempts();
    registerActivity();
    
    if (__DEV__) {
      console.log('🔐 App unlocked');
    }
  }, [registerActivity]);

  /**
   * Check if session has timed out
   */
  const checkTimeout = useCallback(async (): Promise<boolean> => {
    return secureStorage.hasSessionTimedOut(timeoutMs);
  }, [timeoutMs]);

  /**
   * Update the timeout setting
   */
  const setTimeoutMinutes = useCallback(async (minutes: TimeoutOption) => {
    await secureStorage.setInactivityTimeout(minutes);
    setTimeoutMs(minutesToMs(minutes));
    registerActivity(); // Restart timer with new value
    
    if (__DEV__) {
      console.log(`🔐 Timeout updated to ${minutes} minutes`);
    }
  }, [registerActivity]);

  return {
    registerActivity,
    resetTimeout,
    unlockApp,
    checkTimeout,
    setTimeoutMinutes,
    isLocked,
    timeoutMs,
  };
}

/**
 * Get available timeout options for the settings UI
 */
export function getTimeoutOptions(): { value: number; label: string }[] {
  return TIMEOUT_OPTIONS.map(minutes => ({
    value: minutes,
    label: minutes === 1 ? '1 minute' : `${minutes} minutes`,
  }));
}

export default useSessionTimeout;
