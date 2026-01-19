import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  
  useEffect(() => {
    translateY.value = withSpring(isOffline ? 0 : -100, {
      damping: 15,
      stiffness: 150,
    });
  }, [isOffline]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    queryClient.refetchQueries();
  };
  
  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          paddingTop: insets.top,
        },
        animatedStyle,
      ]}
    >
      <View style={{
        backgroundColor: '#d97706',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="cloud-offline-outline" size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>
            You're offline
          </Text>
        </View>
        <Pressable 
          onPress={handleRetry}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="refresh" size={14} color="white" />
          <Text style={{ color: 'white', fontSize: 13, marginLeft: 4, fontWeight: '500' }}>Retry</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}





