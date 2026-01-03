import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { SavingsPot, PotTransaction, TransferToPotPayload } from '@/types/api';

// List all pots
export function usePots() {
  return useQuery({
    queryKey: queryKeys.pots,
    queryFn: async () => {
      const { data } = await api.get<SavingsPot[]>('/pots');
      return data;
    },
  });
}

// Get pot transactions
export function usePotTransactions(potId: string) {
  return useQuery({
    queryKey: queryKeys.potTransactions(potId),
    queryFn: async () => {
      const { data } = await api.get<PotTransaction[]>(`/pots/${potId}/transactions`);
      return data;
    },
    enabled: !!potId,
  });
}

// Create pot
export function useCreatePot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<SavingsPot>('/pots', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pots });
    },
  });
}

// Transfer to/from pot
export function usePotTransfer(potId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: TransferToPotPayload) => {
      const { data } = await api.post(`/pots/${potId}/transfer`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pots });
      queryClient.invalidateQueries({ queryKey: queryKeys.potTransactions(potId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user }); // Funds change
    },
  });
}

// Delete pot (must have zero balance)
export function useDeletePot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (potId: string) => {
      await api.delete(`/pots/${potId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pots });
    },
  });
}

// Flexible transfer hook that accepts potId in payload
// Use this when potId is determined dynamically (e.g., from modal selection)
export function useTransferPot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      potId, 
      amount, 
      currency, 
      type 
    }: { 
      potId: string;
      amount: string;
      currency: 'NGN' | 'GBP' | 'USD' | 'EUR';
      type: 'deposit' | 'withdrawal';
    }) => {
      const { data } = await api.post(`/pots/${potId}/transfer`, { amount, currency, type });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pots });
      queryClient.invalidateQueries({ queryKey: queryKeys.potTransactions(variables.potId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user }); // Funds change
    },
  });
}
