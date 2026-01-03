import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { Contribution } from '@/types/api';

interface UpdateContributionPayload {
  status: 'paid' | 'pending' | 'overdue';
  datePaid?: string | null;
}

interface PaymentRequestResponse {
  success: boolean;
  message: string;
  contributionId: string;
  receiptUrl: string | null;
  cycle: number;
}

// Fetch single contribution
export function useContribution(contributionId: string) {
  return useQuery({
    queryKey: ['contribution', contributionId],
    queryFn: async () => {
      const { data } = await api.get<Contribution>(`/contributions/${contributionId}`);
      return data;
    },
    enabled: !!contributionId,
  });
}

// Update contribution status (general purpose)
export function useUpdateContribution(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contributionId, 
      payload 
    }: { 
      contributionId: string; 
      payload: UpdateContributionPayload;
    }) => {
      const { data } = await api.patch<Contribution>(
        `/contributions/${contributionId}`, 
        payload
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group (including cycle-specific)
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false, // This will match both base and cycle-specific keys
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Mark contribution as paid (convenience hook)
export function useMarkContributionPaid(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contributionId, 
      datePaid 
    }: { 
      contributionId: string; 
      datePaid?: string;
    }) => {
      const { data } = await api.patch<Contribution>(
        `/contributions/${contributionId}`,
        { 
          status: 'paid',
          datePaid: datePaid || new Date().toISOString().split('T')[0]
        }
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group (including cycle-specific)
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Revert contribution to pending
export function useRevertContribution(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionId: string) => {
      const { data } = await api.patch<Contribution>(
        `/contributions/${contributionId}`,
        { status: 'pending', datePaid: null }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupContributions(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
    },
  });
}

// Upload receipt (goes through backend → Cloudinary)
export function useUploadReceipt(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contributionId, 
      imageUri 
    }: { 
      contributionId: string; 
      imageUri: string;
    }) => {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('receipt', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      
      const { data } = await api.post(
        `/contributions/${contributionId}/receipt`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    onSuccess: () => {
      // CRITICAL: Invalidate ALL contribution queries for this group
      // This includes both base queries and cycle-specific queries
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false, // Matches both base and cycle-specific keys
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
    },
  });
}

// Get receipt URL for viewing
export function useReceiptUrl(contributionId: string) {
  return useQuery({
    queryKey: ['receipt', contributionId],
    queryFn: async () => {
      // Fetch the contribution to get the receipt URL
      const { data } = await api.get<Contribution>(`/contributions/${contributionId}`);
      return {
        receiptUrl: data.receiptUrl || null,
        contributionId,
      };
    },
    enabled: !!contributionId,
  });
}

// Decline contribution - deletes the record so member can resubmit
export function useDeclineContribution(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionId: string) => {
      // Use the new decline endpoint that deletes the record and cleans up Cloudinary
      const { data } = await api.patch<{ success: boolean; message: string }>(
        `/contributions/${contributionId}/decline`
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Approve contribution - marks as paid using the new approve endpoint
export function useApproveContribution(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionId: string) => {
      // Use the new approve endpoint
      const { data } = await api.patch<{ success: boolean; message: string }>(
        `/contributions/${contributionId}/approve`
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Initialize contributions for a group (creates records for current cycle)
// Call this when contributions are missing for members
export function useInitializeContributions(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        message: string;
        cycle: number;
        created: number;
        total: number;
      }>(`/groups/${groupId}/initialize-contributions`);
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
    },
  });
}

/**
 * Submit a payment request (with optional receipt)
 * This creates a contribution record AND uploads receipt in one go.
 * No need for pre-existing contribution records.
 */
export function useSubmitPaymentRequest(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ imageUri }: { imageUri?: string }) => {
      const formData = new FormData();
      
      // Add receipt if provided
      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('receipt', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }
      
      const { data } = await api.post<PaymentRequestResponse>(
        `/groups/${groupId}/payment-request`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all contribution-related queries for this group
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

/**
 * Advance group to next cycle (admin only)
 * This also deletes all receipts from Cloudinary for the completed cycle
 */
export function useAdvanceCycle(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        previousCycle: number;
        currentCycle: number;
      }>(`/groups/${groupId}/advance-cycle`);
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ 
        queryKey: ['groups', groupId, 'contributions'],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}
