import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
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
  
  // Already signed in? Go to main app
  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)" />;
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
