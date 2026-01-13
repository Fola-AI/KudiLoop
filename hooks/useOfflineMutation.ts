import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useNetworkStatus } from './useNetworkStatus';
import { safeAlert } from '@/utils/alertGate';

const PENDING_MUTATIONS_KEY = 'kudiloop-pending-mutations';

export interface PendingMutation {
  id: string;
  type: string;
  data: any;
  createdAt: string;
}

/**
 * Secure storage for offline mutation queue
 * Uses expo-secure-store to encrypt queued mutations
 */
const secureQueueStorage = {
  async get(): Promise<PendingMutation[]> {
    try {
      const existing = await SecureStore.getItemAsync(PENDING_MUTATIONS_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to read mutation queue:', error);
      }
      return [];
    }
  },

  async set(mutations: PendingMutation[]): Promise<void> {
    try {
      await SecureStore.setItemAsync(PENDING_MUTATIONS_KEY, JSON.stringify(mutations));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to write mutation queue:', error);
      }
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(PENDING_MUTATIONS_KEY);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to clear mutation queue:', error);
      }
    }
  },
};

/**
 * Save mutation for later when offline
 */
export async function queueMutation(type: string, data: any): Promise<void> {
  try {
    const mutations = await secureQueueStorage.get();
    
    mutations.push({
      id: Date.now().toString(),
      type,
      data,
      createdAt: new Date().toISOString(),
    });
    
    await secureQueueStorage.set(mutations);
    
    safeAlert(
      'Saved Offline',
      'Your action will be synced when you\'re back online.'
    );
    
    if (__DEV__) {
      console.log(`📥 Queued offline mutation: ${type}`);
    }
    
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to queue mutation:', error);
    }
    safeAlert('Error', 'Failed to save action for offline. Please try again.');
  }
}

/**
 * Get pending mutations count
 */
export async function getPendingMutationsCount(): Promise<number> {
  const mutations = await secureQueueStorage.get();
  return mutations.length;
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  return secureQueueStorage.get();
}

/**
 * Process pending mutations when back online
 */
export async function processPendingMutations(
  handlers: Record<string, (data: any) => Promise<void>>
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  
  try {
    const mutations = await secureQueueStorage.get();
    if (mutations.length === 0) return { processed: 0, failed: 0 };
    
    if (__DEV__) {
      console.log(`📤 Processing ${mutations.length} pending mutations...`);
    }
    
    const failedMutations: PendingMutation[] = [];
    
    for (const mutation of mutations) {
      const handler = handlers[mutation.type];
      if (handler) {
        try {
          await handler(mutation.data);
          processed++;
          if (__DEV__) {
            console.log(`✅ Processed mutation: ${mutation.type}`);
          }
        } catch (error) {
          failed++;
          failedMutations.push(mutation);
          if (__DEV__) {
            console.error(`❌ Failed mutation: ${mutation.type}`, error);
          }
        }
      } else {
        // No handler for this type - skip but log
        if (__DEV__) {
          console.warn(`⚠️ No handler for mutation type: ${mutation.type}`);
        }
      }
    }
    
    // Keep only failed mutations for retry later
    if (failedMutations.length > 0) {
      await secureQueueStorage.set(failedMutations);
    } else {
      await secureQueueStorage.clear();
    }
    
    return { processed, failed };
    
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to process pending mutations:', error);
    }
    return { processed, failed };
  }
}

/**
 * Clear all pending mutations
 */
export async function clearPendingMutations(): Promise<void> {
  await secureQueueStorage.clear();
}

/**
 * Hook for mutations that work offline
 * Will queue the mutation if offline and execute when back online
 */
export function useOfflineAwareMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    mutationType: string;
    onOfflineQueue?: () => void;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const { isOffline } = useNetworkStatus();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (isOffline && options?.mutationType) {
        await queueMutation(options.mutationType, variables);
        options.onOfflineQueue?.();
        // Return a fake success to allow optimistic updates
        return { queued: true } as unknown as TData;
      }
      return mutationFn(variables);
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
