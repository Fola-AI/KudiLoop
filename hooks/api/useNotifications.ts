import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Notification {
  id: string;
  userId: string;
  type: 
    | 'contribution_reminder' 
    | 'contribution_received' 
    | 'payout_upcoming' 
    | 'payout_received' 
    | 'group_invitation' 
    | 'group_joined' 
    | 'cycle_advanced' 
    | 'message_received' 
    | 'system_announcement';
  channel: 'push' | 'email' | 'in_app';
  title: string;
  body: string;
  metadata: {
    groupId?: string;
    contributionId?: string;
    inviteToken?: string;
    [key: string]: any;
  };
  isRead: number;
  sentAt: string;
  readAt: string | null;
}

// Query keys for notifications
export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

// Get all notifications
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Notification[]>('/notifications');
      return data;
    },
  });
}

// Get unread count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      return data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

// Mark all as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}






