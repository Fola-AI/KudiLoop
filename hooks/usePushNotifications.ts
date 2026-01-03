import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

// Check if running in Expo Go BEFORE importing notifications
const isExpoGo = Constants.appOwnership === 'expo';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const router = useRouter();

  useEffect(() => {
    // Skip ALL notification setup in Expo Go
    if (isExpoGo) {
      console.log('📱 Push notifications skipped - not supported in Expo Go');
      console.log('ℹ️  Create a development build to test push notifications');
      return;
    }

    // Only import and use notifications in non-Expo Go environments
    setupPushNotifications();

    return () => {
      cleanupNotifications();
    };
  }, []);

  const setupPushNotifications = async () => {
    try {
      // Dynamic import to avoid loading the module in Expo Go
      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Must be a physical device
      if (!Device.default.isDevice) {
        console.log('Push notifications require a physical device');
        return;
      }

      // Check/request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get the token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log('ℹ️  No EAS projectId - push notifications will work after EAS setup');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      setExpoPushToken(tokenData.data);
      console.log('✅ Push token obtained:', tokenData.data);

      // Register with backend
      await registerTokenWithBackend(tokenData.data);

      // Set up listeners
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          handleNotificationNavigation(data);
        }
      );

    } catch (err: any) {
      // Silently handle errors in development
      console.log('Push notification setup skipped:', err.message);
    }
  };

  const cleanupNotifications = async () => {
    if (isExpoGo) return;
    
    try {
      const Notifications = await import('expo-notifications');
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  };

  const handleNotificationNavigation = (data: any) => {
    if (data?.groupId) {
      router.push(`/group/${data.groupId}`);
    } else if (data?.screen) {
      router.push(data.screen);
    }
  };

  const registerTokenWithBackend = async (token: string) => {
    try {
      const { default: api } = await import('@/services/api');
      const Device = await import('expo-device');
      
      await api.post('/device-tokens', {
        token,
        platform: Platform.OS,
        deviceName: Device.default.deviceName || `${Platform.OS} device`,
      });
      console.log('✅ Push token registered with backend');
    } catch (err) {
      console.log('Failed to register push token with backend');
    }
  };

  // Deregister push token from backend (called on sign out)
  const deregisterToken = async () => {
    // Skip in Expo Go or if no token
    if (isExpoGo || !expoPushToken) {
      console.log('📱 Push token deregistration skipped (Expo Go or no token)');
      return;
    }
    
    try {
      const { default: api } = await import('@/services/api');
      // Token is URL encoded in the path parameter
      await api.delete(`/device-tokens/${encodeURIComponent(expoPushToken)}`);
      console.log('✅ Push token deregistered from backend');
      setExpoPushToken(null);
    } catch (err) {
      // Don't block sign out if deregistration fails
      console.log('Failed to deregister push token (non-blocking)');
    }
  };

  return { expoPushToken, error, deregisterToken };
}
