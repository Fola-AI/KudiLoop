import { useState, useEffect, useRef } from 'react';
import { Platform, InteractionManager } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useUIReady } from '@/contexts/UIReadyContext';

// Check if running in Expo Go BEFORE importing notifications
const isExpoGo = Constants.appOwnership === 'expo';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const router = useRouter();
  const isMountedRef = useRef(true);
  const hasRequestedRef = useRef(false);
  
  // Use the UIReady context for safe permission requests
  const { isUIReady, safelyRequestPermission } = useUIReady();

  useEffect(() => {
    isMountedRef.current = true;
    
    // Skip ALL notification setup in Expo Go
    if (isExpoGo) {
      if (__DEV__) {
        console.log('📱 Push notifications skipped - not supported in Expo Go');
        console.log('ℹ️  Create a development build to test push notifications');
      }
      return;
    }

    return () => {
      isMountedRef.current = false;
      cleanupNotifications();
    };
  }, []);

  // Only request permissions when UI is ready and we haven't requested yet
  useEffect(() => {
    if (isExpoGo || !isUIReady || hasRequestedRef.current) return;
    
    hasRequestedRef.current = true;
    
    // Additional delay after UI is ready for extra safety on iOS
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        safelyRequestPermission(async () => {
          await setupPushNotifications();
          return true;
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isUIReady, safelyRequestPermission]);

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
        if (__DEV__) {
          console.log('Push notifications require a physical device');
        }
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
        if (__DEV__) {
          console.log('Push notification permission not granted');
        }
        return;
      }

      // Get the token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        if (__DEV__) {
          console.log('ℹ️  No EAS projectId - push notifications will work after EAS setup');
        }
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      if (isMountedRef.current) {
        setExpoPushToken(tokenData.data);
      }
      if (__DEV__) {
        console.log('✅ Push token obtained:', tokenData.data);
      }

      // Register with backend
      await registerTokenWithBackend(tokenData.data);

      // Set up listeners
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          if (__DEV__) {
            console.log('Notification received:', notification);
          }
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
      if (__DEV__) {
        console.log('Push notification setup skipped:', err.message);
      }
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
      if (__DEV__) {
        console.log('✅ Push token registered with backend');
      }
    } catch (err) {
      if (__DEV__) {
        console.log('Failed to register push token with backend');
      }
    }
  };

  // Deregister push token from backend (called on sign out)
  const deregisterToken = async () => {
    // Skip in Expo Go or if no token
    if (isExpoGo || !expoPushToken) {
      if (__DEV__) {
        console.log('📱 Push token deregistration skipped (Expo Go or no token)');
      }
      return;
    }
    
    try {
      const { default: api } = await import('@/services/api');
      // Token is URL encoded in the path parameter
      await api.delete(`/device-tokens/${encodeURIComponent(expoPushToken)}`);
      if (__DEV__) {
        console.log('✅ Push token deregistered from backend');
      }
      setExpoPushToken(null);
    } catch (err) {
      // Don't block sign out if deregistration fails
      if (__DEV__) {
        console.log('Failed to deregister push token (non-blocking)');
      }
    }
  };

  return { expoPushToken, error, deregisterToken };
}
