import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, PanResponder } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { secureStorage } from '@/services/secureStorage';
import { config } from '@/config/env';
import { useUserSettings } from '@/hooks/api/useUser';

// Default timeout values in minutes
const DEFAULT_TIMEOUT_MINUTES = 5;
const TIMEOUT_OPTIONS = [1, 3, 5, 10, 15] as const;

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
 * Features:
 * - Reads timeout duration from user settings (server-synced)
 * - Tracks user activity (touches, navigation)
 * - Triggers PIN/biometric re-auth when timeout expires
 * - Pauses during background, resumes on foreground
 * - Does NOT sign out - just requires local re-authentication
 * 
 * @param options Configuration options
 * @param options.enabled Whether session timeout is enabled (default: true)
 * @param options.onTimeout Callback when session times out
 * 
 * @example
 * ```tsx
 * // In your authenticated layout
 * const { registerActivity } = useSessionTimeout({
 *   onTimeout: () => {
 *     console.log('Session timed out');
 *   }
 * });
 * 
 * // Call registerActivity on user interactions if needed
 * ```
 */
export function useSessionTimeout(options?: {
  enabled?: boolean;
  onTimeout?: () => void;
}) {
  const {
    enabled = true,
    onTimeout,
  } = options || {};

  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Get timeout settings from server
  const { data: userSettings } = useUserSettings();
  
  // Determine the timeout in milliseconds
  const timeoutMs = userSettings?.inactivityTimeoutEnabled
    ? minutesToMs(userSettings.inactivityTimeoutMinutes || DEFAULT_TIMEOUT_MINUTES)
    : config.sessionTimeoutMs; // Fallback to config default

  /**
   * Register user activity to reset the inactivity timer
   */
  const registerActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    
    // Clear and restart the inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    if (enabled && appState.current === 'active') {
      inactivityTimer.current = setTimeout(async () => {
        await handleInactivityTimeout();
      }, timeoutMs);
    }
  }, [enabled, timeoutMs]);

  /**
   * Handle inactivity timeout
   */
  const handleInactivityTimeout = useCallback(async () => {
    // Don't trigger if already on auth screens
    if (pathname?.startsWith('/(auth)')) {
      return;
    }
    
    const hasPin = await secureStorage.hasPinSet();
    const hasBiometric = await secureStorage.isBiometricEnabled();
    
    if (hasPin || hasBiometric) {
      if (__DEV__) {
        console.log('🔐 Inactivity timeout - requiring re-auth');
      }
      
      setIsTimedOut(true);
      onTimeout?.();
      
      // Navigate to PIN entry screen
      router.replace('/(auth)/pin-entry');
    }
  }, [pathname, router, onTimeout]);

  /**
   * Handle app state changes (foreground/background)
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (!enabled) return;

    // App going to background
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      backgroundTime.current = Date.now();
      
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
      if (backgroundTime.current) {
        const elapsed = Date.now() - backgroundTime.current;
        
        if (__DEV__) {
          console.log(`🔐 App foregrounded after ${Math.round(elapsed / 1000)}s`);
        }
        
        // If session timed out while backgrounded, require re-authentication
        if (elapsed > timeoutMs) {
          // Don't trigger if already on auth screens
          if (!pathname?.startsWith('/(auth)')) {
            const hasPin = await secureStorage.hasPinSet();
            const hasBiometric = await secureStorage.isBiometricEnabled();
            
            if (hasPin || hasBiometric) {
              if (__DEV__) {
                console.log('🔐 Session timed out while backgrounded, requiring re-auth');
              }
              
              setIsTimedOut(true);
              onTimeout?.();
              
              // Navigate to PIN entry screen
              router.replace('/(auth)/pin-entry');
            }
          }
        } else {
          // Reset activity timer since we're back
          registerActivity();
        }
      }
      backgroundTime.current = null;
    }

    appState.current = nextAppState;
  }, [enabled, timeoutMs, pathname, router, onTimeout, registerActivity]);

  // Set up app state listener
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Update auth time on mount
    secureStorage.updateLastAuthTime();
    
    // Start the inactivity timer
    registerActivity();
    
    return () => {
      subscription.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [enabled, handleAppStateChange, registerActivity]);

  // Reset activity on navigation changes
  useEffect(() => {
    if (enabled && !pathname?.startsWith('/(auth)')) {
      registerActivity();
    }
  }, [pathname, enabled, registerActivity]);

  /**
   * Manually reset the session timeout
   * Call this after successful authentication
   */
  const resetTimeout = useCallback(async () => {
    backgroundTime.current = null;
    setIsTimedOut(false);
    await secureStorage.updateLastAuthTime();
    registerActivity();
    
    if (__DEV__) {
      console.log('🔐 Session timeout reset');
    }
  }, [registerActivity]);

  /**
   * Check if session has timed out
   */
  const checkTimeout = useCallback(async (): Promise<boolean> => {
    return secureStorage.hasSessionTimedOut(timeoutMs);
  }, [timeoutMs]);

  return {
    registerActivity,
    resetTimeout,
    checkTimeout,
    isTimedOut,
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
