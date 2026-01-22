import { Stack, Redirect, usePathname, router } from 'expo-router';
import { View, ActivityIndicator, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import { colors } from '@/theme';
import { secureStorage } from '@/services/secureStorage';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const [isAppLocked, setIsAppLocked] = useState<boolean | null>(null);
  const [isCheckingLock, setIsCheckingLock] = useState(true);
  
  // Check if app is locked
  useEffect(() => {
    const checkLockState = async () => {
      try {
        const locked = await secureStorage.isAppLocked();
        setIsAppLocked(locked);
      } catch (error) {
        setIsAppLocked(false);
      } finally {
        setIsCheckingLock(false);
      }
    };
    
    if (isLoaded) {
      checkLockState();
    }
  }, [isLoaded, pathname]);
  
  if (!isLoaded || isCheckingLock) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }
  
  // If signed in but NOT locked, redirect to main app
  // (Unless we're on biometric-unlock, pin-entry, biometric-setup, or pin-setup screens)
  const isSecurityScreen = pathname?.includes('biometric-unlock') || 
                           pathname?.includes('pin-entry') || 
                           pathname?.includes('biometric-setup') ||
                           pathname?.includes('pin-setup');
  
  if (isSignedIn && !isAppLocked && !isSecurityScreen) {
    return <Redirect href="/(app)/(tabs)" />;
  }
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent swipe back on security screens
      }}
    />
  );
}
