import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNetworkStatus } from './useNetworkStatus';
import { processPendingMutations, getPendingMutationsCount } from './useOfflineMutation';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useUIReady } from '@/contexts/UIReadyContext';

/**
 * Mutation handlers for processing offline actions
 * Add handlers here for each mutation type that can be queued offline
 */
const mutationHandlers: Record<string, (data: any) => Promise<void>> = {
  // Mark contribution as paid
  'mark-contribution-paid': async (data: { 
    groupId: string; 
    memberId: string; 
    cycle: number;
    receiptUrl?: string;
  }) => {
    await api.post(`/groups/${data.groupId}/contributions/${data.memberId}/pay`, {
      cycle: data.cycle,
      receiptUrl: data.receiptUrl,
    });
  },
  
  // Create a new pot
  'create-pot': async (data: { name: string }) => {
    await api.post('/pots', { name: data.name });
  },
  
  // Transfer to/from pot
  'pot-transfer': async (data: {
    potId: string;
    amount: string;
    currency: string;
    type: 'deposit' | 'withdrawal';
  }) => {
    await api.post(`/pots/${data.potId}/transfer`, {
      amount: data.amount,
      currency: data.currency,
      type: data.type,
    });
  },
  
  // Update profile
  'update-profile': async (data: any) => {
    await api.patch('/profile', data);
  },
  
  // Mark notification as read
  'mark-notification-read': async (data: { notificationId: string }) => {
    await api.patch(`/notifications/${data.notificationId}/read`, {});
  },
};

/**
 * Hook that syncs pending mutations when device comes back online
 * Should be used in the app root layout
 */
export function useOnlineSync() {
  const { isOffline } = useNetworkStatus();
  const wasOffline = useRef(false);
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);
  const isMounted = useRef(true);
  const { safelyShowAlert } = useUIReady();
  
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Detect transition from offline to online
    if (wasOffline.current && !isOffline && !isSyncing.current) {
      handleBackOnline();
    }
    
    wasOffline.current = isOffline;
  }, [isOffline]);
  
  const handleBackOnline = async () => {
    isSyncing.current = true;
    
    if (__DEV__) {
      console.log('📶 Back online! Starting sync...');
    }
    
    try {
      // Check if there are pending mutations
      const pendingCount = await getPendingMutationsCount();
      
      if (pendingCount > 0) {
        if (__DEV__) {
          console.log(`📤 Found ${pendingCount} pending mutations to sync`);
        }
        
        // Process pending mutations
        const { processed, failed } = await processPendingMutations(mutationHandlers);
        
        // Show result to user only if component is still mounted
        if (isMounted.current && (processed > 0 || failed > 0)) {
          if (failed > 0) {
            safelyShowAlert(() => Alert.alert(
              'Sync Complete',
              `Synced ${processed} action(s). ${failed} failed and will retry later.`
            ));
          } else if (processed > 0) {
            safelyShowAlert(() => Alert.alert(
              'Back Online',
              `Successfully synced ${processed} offline action(s).`
            ));
          }
        }
      }
      
      // Refetch all queries to get fresh data
      await queryClient.refetchQueries();
      
      if (__DEV__) {
        console.log('✅ Online sync complete');
      }
      
    } catch (error) {
      if (__DEV__) {
        console.error('Sync error:', error);
      }
    } finally {
      isSyncing.current = false;
    }
  };
  
  return {
    isOffline,
  };
}

