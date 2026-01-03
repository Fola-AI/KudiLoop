import { View, Text, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Card, Avatar } from "@/components/ui";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";

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

export default function ProfileScreen() {
  const { user, clerkUser, signOut } = useAuth();
  const { data: groups } = useGroups();
  const { deregisterToken } = usePushNotifications();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
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
  
  const handleSignOut = () => {
    Alert.alert(
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
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          }
        },
      ]
    );
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
            onPress={() => Alert.alert("Coming Soon", "PIN change will be available soon")}
          />
          <SettingsItem
            icon="key-outline"
            iconBg="#ec4899"
            title="Change Password"
            onPress={() => Alert.alert("Coming Soon", "Password change will be available soon")}
          />
          <ToggleItem
            icon="finger-print-outline"
            iconBg="#06b6d4"
            title="Biometric Login"
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
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
            onValueChange={setPushEnabled}
          />
          <ToggleItem
            icon="mail-outline"
            iconBg="#6366f1"
            title="Email Notifications"
            value={emailEnabled}
            onValueChange={setEmailEnabled}
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
            onPress={() => Alert.alert("Coming Soon", "Currency selection will be available soon")}
          />
          <SettingsItem
            icon="moon-outline"
            iconBg="#6366f1"
            title="Appearance"
            subtitle="Dark"
            onPress={() => Alert.alert("Coming Soon", "Theme selection will be available soon")}
          />
        </Card>
        
        {/* Support Section */}
        <SectionHeader title="Support" />
        <Card style={{ marginHorizontal: 16, overflow: 'hidden' }} padding="none">
          <SettingsItem
            icon="help-circle-outline"
            iconBg="#3b82f6"
            title="Help Center"
            onPress={() => Alert.alert("Help", "Visit our help center for FAQs and guides")}
          />
          <SettingsItem
            icon="chatbubble-outline"
            iconBg="#10b981"
            title="Contact Support"
            onPress={() => Alert.alert("Support", "Email us at support@kudiloop.com")}
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
        
        {/* App Version */}
        <Text style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', paddingTop: 24 }}>
          KudiLoop v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
