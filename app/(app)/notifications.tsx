import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';
import { Card } from '@/components/ui';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  Notification 
} from '@/hooks/api/useNotifications';

// Get icon and color based on notification type
function getNotificationStyle(type: string): { icon: string; color: string; bgColor: string } {
  switch (type) {
    case 'contribution_reminder':
      return { icon: 'alarm-outline', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.2)' };
    case 'contribution_received':
      return { icon: 'checkmark-circle-outline', color: '#22c55e', bgColor: 'rgba(34,197,94,0.2)' };
    case 'payout_upcoming':
      return { icon: 'gift-outline', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.2)' };
    case 'payout_received':
      return { icon: 'cash-outline', color: '#22c55e', bgColor: 'rgba(34,197,94,0.2)' };
    case 'group_invitation':
      return { icon: 'person-add-outline', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.2)' };
    case 'group_joined':
      return { icon: 'people-outline', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.2)' };
    case 'cycle_advanced':
      return { icon: 'reload-outline', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.2)' };
    case 'message_received':
      return { icon: 'chatbubble-outline', color: '#ec4899', bgColor: 'rgba(236,72,153,0.2)' };
    case 'system_announcement':
      return { icon: 'megaphone-outline', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.2)' };
    default:
      return { icon: 'notifications-outline', color: colors.primary.DEFAULT, bgColor: 'rgba(255,107,53,0.2)' };
  }
}

// Format relative time
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Notification Item Component
function NotificationItem({ 
  notification, 
  onPress 
}: { 
  notification: Notification;
  onPress: () => void;
}) {
  const { icon, color, bgColor } = getNotificationStyle(notification.type);
  const isUnread = !notification.isRead;
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        padding: 16,
        backgroundColor: isUnread ? 'rgba(255,107,53,0.05)' : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {/* Icon */}
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      
      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text 
            style={{ 
              color: isUnread ? 'white' : '#9ca3af', 
              fontSize: 15, 
              fontWeight: isUnread ? '600' : '500',
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {isUnread && (
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary.DEFAULT,
            }} />
          )}
        </View>
        
        <Text 
          style={{ 
            color: '#6b7280', 
            fontSize: 14, 
            marginTop: 4,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        
        <Text style={{ color: '#4b5563', fontSize: 12, marginTop: 6 }}>
          {formatTime(notification.sentAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  const handleNotificationTap = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    
    // Navigate based on type and metadata
    const { metadata, type } = notification;
    
    if (metadata?.groupId) {
      if (type === 'message_received') {
        router.push(`/group/${metadata.groupId}/messages` as any);
      } else {
        // All group-related notifications navigate to group dashboard
        // (contribution actions are now on the dashboard)
        router.push(`/group/${metadata.groupId}` as any);
      }
    } else if (type === 'group_invitation' && metadata?.inviteToken) {
      router.push(`/join/${metadata.inviteToken}` as any);
    }
  };
  
  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllRead.mutate();
  };
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  // Loading state
  if (isLoading && !refreshing) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: 'Notifications',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackTitle: 'Back',
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading notifications...</Text>
        </View>
      </>
    );
  }
  
  // Error state
  if (error && !notifications) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: 'Notifications',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackTitle: 'Back',
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load notifications
          </Text>
          <Pressable 
            onPress={() => refetch()} 
            style={{
              marginTop: 16,
              backgroundColor: colors.primary.DEFAULT,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: 'Back',
          headerRight: () => unreadCount > 0 ? (
            <Pressable 
              onPress={handleMarkAllRead}
              disabled={markAllRead.isPending}
              style={{ marginRight: 8 }}
            >
              <Ionicons 
                name="checkmark-done" 
                size={24} 
                color={markAllRead.isPending ? '#6b7280' : colors.primary.DEFAULT} 
              />
            </Pressable>
          ) : null,
        }}
      />
      
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {!notifications || notifications.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(107,114,128,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="notifications-outline" size={40} color="#6b7280" />
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>No Notifications</Text>
            <Text style={{ 
              color: '#9ca3af', 
              fontSize: 14, 
              textAlign: 'center', 
              marginTop: 8,
              lineHeight: 20,
            }}>
              You'll see payment reminders, group updates, and more here
            </Text>
          </View>
        ) : (
          <>
            {/* Unread section */}
            {unreadCount > 0 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  New ({unreadCount})
                </Text>
              </View>
            )}
            
            {notifications
              .filter(n => !n.isRead)
              .map((notification) => (
                <NotificationItem 
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationTap(notification)}
                />
              ))
            }
            
            {/* Read section */}
            {notifications.some(n => n.isRead) && (
              <>
                <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
                  <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Earlier
                  </Text>
                </View>
                
                {notifications
                  .filter(n => n.isRead)
                  .map((notification) => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      onPress={() => handleNotificationTap(notification)}
                    />
                  ))
                }
              </>
            )}
            
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </>
  );
}

