import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, Modal, Animated } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useRef, useEffect } from "react";
import { Card, Avatar } from "@/components/ui";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups, useUserSettings, useUpdateSettings, useDeleteAccount } from "@/hooks/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getTimeoutOptions } from "@/hooks/useSessionTimeout";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Settings Item Component
function SettingsItem({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      
      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>{title}</Text>
        {subtitle && (
          <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#4b5563" />
      )}
    </Pressable>
  );
}

// Toggle Item Component
function ToggleItem({
  icon,
  iconBg,
  title,
  value,
  onValueChange,
}: {
  icon: string;
  iconBg: string;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#1f2937',
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      
      <Text style={{ flex: 1, marginLeft: 12, color: 'white', fontSize: 15, fontWeight: '500' }}>
        {title}
      </Text>
      
      <Switch
        value={value}
        onValueChange={(val) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(val);
        }}
        trackColor={{ false: '#374151', true: colors.primary.DEFAULT }}
        thumbColor="white"
      />
    </View>
  );
}

// Section Header
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ 
      color: '#6b7280', 
      fontSize: 12, 
      fontWeight: '600', 
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    }}>
      {title}
    </Text>
  );
}

// Bottom Sheet Picker for Timeout Selection
function TimeoutPickerSheet({
  visible,
  currentValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentValue: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const options = getTimeoutOptions();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable 
        style={{ flex: 1 }}
        onPress={onClose}
      >
        <Animated.View 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
            opacity: fadeAnim,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              style={{ 
                backgroundColor: colors.card,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 8,
                paddingBottom: 34,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Handle bar */}
              <View style={{ 
                alignItems: 'center', 
                paddingVertical: 12,
              }}>
                <View style={{ 
                  width: 40, 
                  height: 4, 
                  backgroundColor: '#4b5563', 
                  borderRadius: 2,
                }} />
              </View>

              {/* Title */}
              <Text style={{ 
                color: 'white', 
                fontSize: 18, 
                fontWeight: '600',
                textAlign: 'center',
                paddingBottom: 16,
              }}>
                Auto-lock Timeout
              </Text>

              {/* Description */}
              <Text style={{ 
                color: '#9ca3af', 
                fontSize: 14, 
                textAlign: 'center',
                paddingHorizontal: 24,
                paddingBottom: 20,
              }}>
                Your app will lock after this period of inactivity
              </Text>

              {/* Options */}
              {options.map((option, index) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(option.value);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderTopWidth: index === 0 ? 1 : 0,
                    borderBottomWidth: 1,
                    borderColor: '#1f2937',
                  })}
                >
                  <Text style={{ 
                    color: currentValue === option.value ? colors.primary.DEFAULT : 'white', 
                    fontSize: 16,
                    fontWeight: currentValue === option.value ? '600' : '400',
                  }}>
                    {option.label}
                  </Text>
                  
                  {currentValue === option.value && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={colors.primary.DEFAULT} 
                    />
                  )}
                </Pressable>
              ))}

              {/* Cancel button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                style={({ pressed }) => ({
                  marginTop: 16,
                  marginHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                })}
              >
                <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '500' }}>
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { user, clerkUser, signOut } = useAuth();
  const { data: groups } = useGroups();
  const { data: userSettings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const deleteAccountMutation = useDeleteAccount();
  const { deregisterToken } = usePushNotifications();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);
  
  // Sync local state with server settings
  useEffect(() => {
    if (userSettings) {
      setBiometricEnabled(userSettings.biometricEnabled === 1);
      setPushEnabled(userSettings.pushNotificationsEnabled === 1);
      setEmailEnabled(userSettings.emailNotificationsEnabled === 1);
    }
  }, [userSettings]);
  
  // Debug: Log user data on profile page
  if (__DEV__) {
    console.log('👤 Profile Page - user.profileImageUrl:', user?.profileImageUrl);
    console.log('👤 Profile Page - user.avatarChoice:', user?.avatarChoice);
  }
  
  // Use real user data from backend or Clerk
  const firstName = user?.firstName || clerkUser?.firstName || 'User';
  const lastName = user?.lastName || clerkUser?.lastName || '';
  const email = user?.email || clerkUser?.email || '';
  const phone = user?.phone || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const groupCount = groups?.length || 0;
  
  // Get current timeout value (default to 5 minutes)
  const currentTimeoutMinutes = userSettings?.inactivityTimeoutMinutes || 5;
  const timeoutLabel = currentTimeoutMinutes === 1 ? '1 minute' : `${currentTimeoutMinutes} minutes`;
  
  const handleTimeoutSelect = async (minutes: number) => {
    setShowTimeoutPicker(false);
    
    try {
      await updateSettings.mutateAsync({
        inactivityTimeoutMinutes: minutes,
        inactivityTimeoutEnabled: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (__DEV__) console.error('Failed to update timeout setting:', error);
      safeAlert('Error', 'Failed to update auto-lock timeout. Please try again.');
    }
  };
  
  const handleBiometricToggle = async (enabled: boolean) => {
    setBiometricEnabled(enabled);
    try {
      await updateSettings.mutateAsync({
        biometricEnabled: enabled,
      });
    } catch (error) {
      setBiometricEnabled(!enabled); // Revert on error
      if (__DEV__) console.error('Failed to update biometric setting:', error);
    }
  };
  
  const handlePushToggle = async (enabled: boolean) => {
    setPushEnabled(enabled);
    try {
      await updateSettings.mutateAsync({
        pushNotificationsEnabled: enabled,
      });
    } catch (error) {
      setPushEnabled(!enabled); // Revert on error
      if (__DEV__) console.error('Failed to update push notification setting:', error);
    }
  };
  
  const handleEmailToggle = async (enabled: boolean) => {
    setEmailEnabled(enabled);
    try {
      await updateSettings.mutateAsync({
        emailNotificationsEnabled: enabled,
      });
    } catch (error) {
      setEmailEnabled(!enabled); // Revert on error
      if (__DEV__) console.error('Failed to update email notification setting:', error);
    }
  };
  
  const handleSignOut = () => {
    safeAlert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            setIsSigningOut(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              // Deregister push token first (so we don't get notifications after sign out)
              await deregisterToken();
              await signOut();
              // The AuthContext will handle redirect via the layout
            } catch (error) {
              if (__DEV__) console.error('Sign out error:', error);
              safeAlert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    safeAlert(
      "Delete Account",
      "Are you sure you want to permanently delete your account?\n\nThis will delete:\n• Your profile and personal data\n• All your group memberships\n• Your contribution history\n• Your savings pots\n\nThis action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Delete My Account", 
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    // Second confirmation for extra safety
    safeAlert(
      "Final Confirmation",
      "This will permanently delete your account and all associated data. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete Everything", 
          style: "destructive",
          onPress: () => performAccountDeletion(),
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    setIsDeleting(true);
    
    try {
      // 1. Call backend to delete account
      await deleteAccountMutation.mutateAsync();
      
      // 2. Clear local secure storage
      try {
        await SecureStore.deleteItemAsync("pin_hash");
        await SecureStore.deleteItemAsync("pin_salt");
        await SecureStore.deleteItemAsync("biometric_enabled");
        await SecureStore.deleteItemAsync("clerk_token");
      } catch (storageError) {
        if (__DEV__) console.log('Error clearing secure storage:', storageError);
      }
      
      // 3. Clear AsyncStorage cached data
      try {
        await AsyncStorage.clear();
      } catch (asyncError) {
        if (__DEV__) console.log('Error clearing async storage:', asyncError);
      }
      
      // 4. Sign out from Clerk
      await signOut();
      
      // 5. Show success and redirect
      safeAlert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/welcome"),
          }
        ]
      );
      
    } catch (error) {
      if (__DEV__) console.error("Delete account error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      safeAlert(
        "Error",
        "Failed to delete your account. Please try again or contact support at support@kudiloop.com",
        [{ text: "OK" }]
      );
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          Profile
        </Text>
        
        {/* User Card */}
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/edit');
            }}
          >
            <Card variant="elevated" style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar 
                  source={user?.profileImageUrl}
                  avatarChoice={user?.avatarChoice}
                  name={fullName} 
                  size="xl" 
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{fullName}</Text>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success.DEFAULT} style={{ marginLeft: 6 }} />
                  </View>
                  <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>{email}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="people-outline" size={14} color="#6b7280" />
                      <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>
                        {groupCount} groups
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#4b5563" />
              </View>
            </Card>
          </Pressable>
        </View>
        
        {/* Account Section */}
        <SectionHeader title="Account" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="person-outline"
            iconBg="#3b82f6"
            title="Personal Information"
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsItem
            icon="call-outline"
            iconBg="#10b981"
            title="Phone Number"
            subtitle={phone || 'Not set'}
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsItem
            icon="business-outline"
            iconBg="#8b5cf6"
            title="Bank Accounts"
            onPress={() => router.push('/profile/banks')}
          />
          <SettingsItem
            icon="wallet-outline"
            iconBg="#f59e0b"
            title="Savings Pots"
            onPress={() => router.push('/profile/pots')}
          />
        </Card>
        
        {/* Security Section */}
        <SectionHeader title="Security" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="lock-closed-outline"
            iconBg="#ef4444"
            title="Change PIN"
            onPress={() => safeAlert("Coming Soon", "PIN change will be available soon")}
          />
          <SettingsItem
            icon="key-outline"
            iconBg="#ec4899"
            title="Change Password"
            onPress={() => safeAlert("Coming Soon", "Password change will be available soon")}
          />
          <SettingsItem
            icon="time-outline"
            iconBg="#f97316"
            title="Auto-lock Timeout"
            subtitle={timeoutLabel}
            onPress={() => setShowTimeoutPicker(true)}
          />
          <ToggleItem
            icon="finger-print-outline"
            iconBg="#06b6d4"
            title="Biometric Login"
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
        </Card>
        
        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="notifications-outline"
            iconBg="#f59e0b"
            title="View Notifications"
            onPress={() => router.push('/notifications')}
          />
          <ToggleItem
            icon="notifications-outline"
            iconBg="#f59e0b"
            title="Push Notifications"
            value={pushEnabled}
            onValueChange={handlePushToggle}
          />
          <ToggleItem
            icon="mail-outline"
            iconBg="#6366f1"
            title="Email Notifications"
            value={emailEnabled}
            onValueChange={handleEmailToggle}
          />
        </Card>
        
        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="cash-outline"
            iconBg="#10b981"
            title="Default Currency"
            subtitle="NGN"
            onPress={() => safeAlert("Coming Soon", "Currency selection will be available soon")}
          />
          <SettingsItem
            icon="moon-outline"
            iconBg="#6366f1"
            title="Appearance"
            subtitle="Dark"
            onPress={() => safeAlert("Coming Soon", "Theme selection will be available soon")}
          />
        </Card>
        
        {/* Support Section */}
        <SectionHeader title="Support" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="help-circle-outline"
            iconBg="#3b82f6"
            title="Help Center"
            onPress={() => safeAlert("Help", "Visit our help center for FAQs and guides")}
          />
          <SettingsItem
            icon="chatbubble-outline"
            iconBg="#10b981"
            title="Contact Support"
            onPress={() => safeAlert("Support", "Email us at support@kudiloop.com")}
          />
        </Card>
        
        {/* Legal Section */}
        <SectionHeader title="Legal" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="document-text-outline"
            iconBg="#6b7280"
            title="Terms of Service"
            onPress={() => router.push('/terms')}
          />
          <SettingsItem
            icon="shield-outline"
            iconBg="#6b7280"
            title="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />
        </Card>
        
        {/* Sign Out */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Pressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(239,68,68,0.1)',
              opacity: isSigningOut ? 0.5 : 1,
            }}
          >
            {isSigningOut ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Sign Out</Text>
              </>
            )}
          </Pressable>
        </View>
        
        {/* Delete Account - Apple App Store requirement */}
        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 24 }}>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            style={({ pressed }) => ({
              alignItems: "center",
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.error.DEFAULT,
              opacity: pressed || isDeleting ? 0.6 : 1,
            })}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.error.DEFAULT} />
            ) : (
              <Text style={{ color: colors.error.DEFAULT, fontSize: 15, fontWeight: "500" }}>
                Delete Account
              </Text>
            )}
          </Pressable>
          <Text style={{ 
            color: colors.textSubtle, 
            fontSize: 12, 
            textAlign: "center",
            marginTop: 8,
          }}>
            Permanently delete your account and all data
          </Text>
        </View>
        
        {/* App Version */}
        <Text style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', paddingTop: 8 }}>
          KudiLoop v1.0.0
        </Text>
      </ScrollView>
      
      {/* Timeout Picker Bottom Sheet */}
      <TimeoutPickerSheet
        visible={showTimeoutPicker}
        currentValue={currentTimeoutMinutes}
        onSelect={handleTimeoutSelect}
        onClose={() => setShowTimeoutPicker(false)}
      />
    </SafeAreaView>
  );
}
