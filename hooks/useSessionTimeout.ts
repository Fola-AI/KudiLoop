import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { secureStorage } from '@/services/secureStorage';
import { config } from '@/config/env';

/**
 * Hook to handle session timeout when app is backgrounded
 * 
 * When the app comes back to foreground after SESSION_TIMEOUT_MS,
 * the user is redirected to PIN/biometric re-authentication
 * 
 * @param options Configuration options
 * @param options.enabled Whether session timeout is enabled (default: true)
 * @param options.timeoutMs Custom timeout in milliseconds (default: from config)
 * @param options.onTimeout Callback when session times out
 * 
 * @example
 * ```tsx
 * // In your authenticated layout
 * useSessionTimeout({
 *   onTimeout: () => {
 *     console.log('Session timed out');
 *   }
 * });
 * ```
 */
export function useSessionTimeout(options?: {
  enabled?: boolean;
  timeoutMs?: number;
  onTimeout?: () => void;
}) {
  const {
    enabled = true,
    timeoutMs = config.sessionTimeoutMs,
    onTimeout,
  } = options || {};

  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (!enabled) return;

    // App going to background
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      backgroundTime.current = Date.now();
      await secureStorage.updateLastAuthTime();
      
      if (__DEV__) {
        console.log('🔐 App backgrounded, auth time saved');
      }
    }

    // App coming to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (backgroundTime.current) {
        const elapsed = Date.now() - backgroundTime.current;
        
        if (__DEV__) {
          console.log(`🔐 App foregrounded after ${Math.round(elapsed / 1000)}s`);
        }
        
        // If session timed out, require re-authentication
        if (elapsed > timeoutMs) {
          const hasPin = await secureStorage.hasPinSet();
          const hasBiometric = await secureStorage.isBiometricEnabled();
          
          if (hasPin || hasBiometric) {
            if (__DEV__) {
              console.log('🔐 Session timed out, requiring re-auth');
            }
            
            onTimeout?.();
            
            // Navigate to PIN entry screen
            router.replace('/(auth)/pin-entry');
          }
        }
      }
      backgroundTime.current = null;
    }

    appState.current = nextAppState;
  }, [enabled, timeoutMs, router, onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Update auth time on mount
    secureStorage.updateLastAuthTime();
    
    return () => {
      subscription.remove();
    };
  }, [enabled, handleAppStateChange]);

  /**
   * Manually reset the session timeout
   * Call this after successful authentication
   */
  const resetTimeout = useCallback(async () => {
    backgroundTime.current = null;
    await secureStorage.updateLastAuthTime();
    
    if (__DEV__) {
      console.log('🔐 Session timeout reset');
    }
  }, []);

  /**
   * Check if session has timed out
   */
  const checkTimeout = useCallback(async (): Promise<boolean> => {
    return secureStorage.hasSessionTimedOut(timeoutMs);
  }, [timeoutMs]);

  return {
    resetTimeout,
    checkTimeout,
  };
}

export default useSessionTimeout;

