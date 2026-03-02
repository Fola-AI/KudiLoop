import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * React Query client configuration
 * 
 * This handles:
 * - Caching API responses
 * - Background refetching
 * - Retry logic
 * - Stale time configuration
 * - Offline support with persistence
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      
      // Keep unused data for 24 hours (for offline support)
      gcTime: 1000 * 60 * 60 * 24,
      
      // Smart retry logic
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.response?.status === 401) return false;
        if (error?.response?.status === 403) return false;
        if (error?.response?.status === 404) return false;
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Don't refetch on window focus on mobile (saves battery/data)
      refetchOnWindowFocus: false,
      
      // Refetch when network reconnects
      refetchOnReconnect: true,

      // Silent background refresh every 5 seconds for near real-time updates.
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
      
      // Use cached data while fetching (optimistic by default)
      placeholderData: (previousData: any) => previousData,
      
      // Network mode - try cache first for better offline experience
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations when they fail
      retry: 2,
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Create persister for AsyncStorage
 * This allows queries to survive app restarts
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'kudiloop-query-cache',
  throttleTime: 1000, // Only persist once per second max
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

// Export PersistQueryClientProvider for use in root layout
export { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

/**
 * Query key factory
 * 
 * Centralized keys ensure consistency and make invalidation easy.
 * Example: queryClient.invalidateQueries({ queryKey: queryKeys.groups })
 */
export const queryKeys = {
  // Auth & User
  user: ['user'] as const,
  settings: ['settings'] as const,
  
  // Groups
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  groupMembers: (id: string) => ['groups', id, 'members'] as const,
  groupContributions: (id: string) => ['groups', id, 'contributions'] as const,
  groupContributionsByCycle: (id: string, cycle: number) => 
    ['groups', id, 'contributions', cycle] as const,
  groupInvites: (id: string) => ['groups', id, 'invites'] as const,
  groupMessages: (id: string) => ['groups', id, 'messages'] as const,
  
  // Invites (public)
  invite: (token: string) => ['invite', token] as const,
  
  // Savings Pots
  pots: ['pots'] as const,
  pot: (id: string) => ['pots', id] as const,
  potTransactions: (id: string) => ['pots', id, 'transactions'] as const,
  
  // Activity & Messages
  recentActivity: ['activity', 'recent'] as const,
  inbox: ['messages', 'inbox'] as const,
  unreadCount: ['messages', 'unread-count'] as const,
};
