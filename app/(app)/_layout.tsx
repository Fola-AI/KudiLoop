import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export default function AppLayout() {
  const { 
    isLoaded, 
    isSignedIn, 
    isLoadingUser, 
    userError,
    refreshUser,
    clerkUser,
  } = useAuth();
  
  // Initialize push notifications
  const { expoPushToken } = usePushNotifications();
  
  // Initialize online sync (processes queued mutations when back online)
  const { isOffline } = useOnlineSync();
  
  // Initialize session timeout (locks app after inactivity)
  const { registerActivity } = useSessionTimeout({
    onTimeout: () => {
      if (__DEV__) {
        console.log('🔐 Session timed out - user sent to PIN entry');
      }
    },
  });
  
  // Log token for testing (only in dev)
  useEffect(() => {
    if (__DEV__ && expoPushToken) {
      console.log('📱 Push token ready:', expoPushToken);
    }
  }, [expoPushToken]);
  
  // Log offline status changes (only in dev)
  useEffect(() => {
    if (__DEV__) {
      console.log(`📶 Network status: ${isOffline ? 'OFFLINE' : 'ONLINE'}`);
    }
  }, [isOffline]);
  
  // Still checking auth
  if (!isLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text style={{ color: '#6b7280', marginTop: 12, fontSize: 14 }}>
          Checking session...
        </Text>
      </View>
    );
  }
  
  // Not signed in? Go to auth
  if (!isSignedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Loading user from backend
  if (isLoadingUser) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text style={{ color: '#6b7280', marginTop: 12, fontSize: 14 }}>
          Loading your account...
        </Text>
      </View>
    );
  }

  // Backend error - show retry option
  if (userError) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 24,
      }}>
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
        </View>
        
        <Text style={{ 
          color: colors.text, 
          fontSize: 20, 
          fontWeight: '600',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Failed to Load Account
        </Text>
        
        <Text style={{ 
          color: '#9ca3af', 
          fontSize: 14, 
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        }}>
          {userError}
        </Text>

        {clerkUser && (
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            width: '100%',
          }}>
            <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>
              Signed in as
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
              {clerkUser.firstName} {clerkUser.lastName}
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>
              {clerkUser.email}
            </Text>
          </View>
        )}
        
        <Pressable
          onPress={refreshUser}
          style={({ pressed }) => ({
            backgroundColor: colors.primary.DEFAULT,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
