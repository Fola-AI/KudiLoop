import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Pressable, LogBox, InteractionManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIReadyProvider } from '@/contexts/UIReadyContext';
import { queryClient, asyncStoragePersister, PersistQueryClientProvider } from '@/services/queryClient';
import { tokenCache } from '@/services/tokenCache';
import { colors } from '@/theme';
import api from '@/services/api';
import { env } from '@/config/env';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import ErrorBoundary from '@/components/ErrorBoundary';
import { setAppReady as openAlertGate } from '@/utils/alertGate';
import '../global.css';

// Ensure OAuth sessions can complete on return
WebBrowser.maybeCompleteAuthSession();

// Suppress ALL LogBox errors and warnings - no error dialogs should show to users
// This prevents the red error screen from appearing for non-fatal errors
LogBox.ignoreAllLogs(true);

// Additionally ignore specific patterns (belt and suspenders approach)
LogBox.ignoreLogs([
  'Network Error',
  'Network request failed',
  'Unable to connect',
  'timeout',
  'ECONNREFUSED',
  'ERR_NETWORK',
  '❌',
  '⚠️',
  'Warning:',
  'Non-serializable values were found',
]);

// Prevent auto-hide of native splash
ExpoSplashScreen.preventAutoHideAsync();

// Fallback Clerk key from environment variable (for when backend is unreachable)
const FALLBACK_CLERK_KEY = env.clerkPublishableKey;

function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>
        {message || 'Loading KudiLoop...'}
      </Text>
    </View>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    }}>
      <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
        Connection Failed
      </Text>
      <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
        {message}
      </Text>
      <Pressable 
        onPress={onRetry}
        style={{
          backgroundColor: colors.primary.DEFAULT,
          paddingHorizontal: 32,
          paddingVertical: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [clerkKey, setClerkKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  // Wait for UI to be fully mounted before initializing Clerk
  // This prevents "no presenter" crashes on iOS when alerts try to show too early
  const [uiReady, setUiReady] = useState(false);

  const fetchClerkConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (__DEV__) console.log('🔄 Fetching Clerk config from backend...');
      const response = await api.get('/auth/clerk-config');
      const { publishableKey } = response.data;
      
      if (!publishableKey) {
        throw new Error('Invalid configuration received from server');
      }
      
      setClerkKey(publishableKey);
      if (__DEV__) console.log('✅ Clerk config loaded from backend');
    } catch (err: any) {
      const errorMessage = err?.message || '';
      const isOfflineError = 
        errorMessage === 'OFFLINE' ||
        errorMessage.includes('Network') ||
        errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('timeout') ||
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ERR_NETWORK';
      
      // Use fallback key if available (works in dev and prod)
      if (FALLBACK_CLERK_KEY) {
        if (__DEV__) {
          if (isOfflineError) {
            console.log('📴 Offline - using cached Clerk config');
          } else {
            console.log('⚠️ Using fallback Clerk key');
          }
        }
        setClerkKey(FALLBACK_CLERK_KEY);
        setError(null);
        return;
      }
      
      // Only show error if no fallback available
      if (__DEV__) console.error('❌ Failed to fetch Clerk config:', errorMessage);
      
      if (isOfflineError) {
        setError('Cannot reach server. Please check your internet connection.');
      } else {
        setError(errorMessage || 'Failed to connect to KudiLoop.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        await fetchClerkConfig();
      } catch (e) {
        if (__DEV__) console.warn(e);
      } finally {
        // Mark app as ready first
        setAppReady(true);
        // Hide native splash screen safely after interactions complete
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            ExpoSplashScreen.hideAsync();
          }, 100);
        });
      }
    }

    prepare();
  }, []);

  // Wait for UI to be fully ready before initializing Clerk
  // This is critical on iOS to prevent native crashes when the root view controller
  // isn't ready to present alert dialogs (permission requests, etc.)
  useEffect(() => {
    if (!appReady) return;

    // On iOS, we need extra delay to ensure the root view controller is fully ready
    // The "COSMCtrl applyPolicyDelta" crash happens when alerts show before presenter is ready
    const delay = Platform.OS === 'ios' ? 500 : 100;
    
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        setUiReady(true);
        if (__DEV__) console.log('✅ UI ready for ClerkProvider initialization');
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [appReady]);

  // Open the alert gate after app is fully ready
  // This prevents iOS crashes from early Alert.alert() calls
  useEffect(() => {
    if (!appReady) return;

    // Wait 3 seconds on iOS before allowing any alerts
    // This gives the root view controller plenty of time to be ready
    const alertDelay = Platform.OS === 'ios' ? 3000 : 500;
    
    const alertTimer = setTimeout(() => {
      openAlertGate();
      if (__DEV__) console.log('✅ Alert gate opened - app ready for alerts');
    }, alertDelay);

    return () => clearTimeout(alertTimer);
  }, [appReady]);

  // Show nothing until app is ready (native splash still visible)
  if (!appReady) {
    return null;
  }

  // Show animated splash after native splash hides
  if (showAnimatedSplash) {
    return (
      <SafeAreaProvider>
        <AnimatedSplash onFinish={() => setShowAnimatedSplash(false)} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Wait for UI to be fully ready before initializing Clerk
  // This prevents iOS crash: "no presenter that can handle this alert item"
  if (!uiReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen message="Connecting to KudiLoop..." />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (error || !clerkKey) {
    return (
      <SafeAreaProvider>
        <ErrorScreen 
          message={error || 'Unable to initialize. Please try again.'} 
          onRetry={fetchClerkConfig}
        />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <UIReadyProvider minimumDelay={2000}>
        <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            <PersistQueryClientProvider 
              client={queryClient}
              persistOptions={{ 
                persister: asyncStoragePersister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
              }}
            >
              <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <SafeAreaProvider>
                    <OfflineBanner />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'slide_from_right',
                      }}
                    />
                    <StatusBar style="light" />
                  </SafeAreaProvider>
                </GestureHandlerRootView>
              </AuthProvider>
            </PersistQueryClientProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </UIReadyProvider>
    </ErrorBoundary>
  );
}
