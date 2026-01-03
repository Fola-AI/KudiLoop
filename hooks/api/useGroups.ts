import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { 
  Group, 
  GroupWithDetails, 
  Member, 
  Contribution,
  InviteLink,
  CreateGroupPayload,
  CreateInvitePayload,
} from '@/types/api';

// List all user's groups
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: async () => {
      const { data } = await api.get<GroupWithDetails[]>('/groups');
      return data;
    },
  });
}

// Get single group with details
export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.group(id),
    queryFn: async () => {
      const { data } = await api.get<GroupWithDetails>(`/groups/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Get group members
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn: async () => {
      const { data } = await api.get<Member[]>(`/groups/${groupId}/members`);
      return data;
    },
    enabled: !!groupId,
  });
}

// Get group contributions (optionally by cycle)
export function useGroupContributions(groupId: string, cycle?: number) {
  return useQuery({
    queryKey: cycle 
      ? queryKeys.groupContributionsByCycle(groupId, cycle)
      : queryKeys.groupContributions(groupId),
    queryFn: async () => {
      const url = cycle 
        ? `/groups/${groupId}/contributions?cycle=${cycle}`
        : `/groups/${groupId}/contributions`;
      const { data } = await api.get<Contribution[]>(url);
      return data;
    },
    enabled: !!groupId,
  });
}

// Create new group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const { data } = await api.post<Group>('/groups', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Update group
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<Group>) => {
      const { data } = await api.patch<Group>(`/groups/${groupId}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Delete group
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      await api.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Get group invites
export function useGroupInvites(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groupInvites(groupId),
    queryFn: async () => {
      const { data } = await api.get<InviteLink[]>(`/groups/${groupId}/invites`);
      return data;
    },
    enabled: !!groupId,
  });
}

// Create invite link
export function useCreateInvite(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CreateInvitePayload) => {
      const { data } = await api.post<InviteLink>(`/groups/${groupId}/invites`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupInvites(groupId) });
    },
  });
}

// Delete invite
export function useDeleteInvite(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await api.delete(`/groups/${groupId}/invites/${inviteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupInvites(groupId) });
    },
  });
}

// Join group via invite
export function useJoinGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/invite/${token}/join`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

// Update rotation order for group members
export function useUpdateRotationOrder(groupId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rotationUpdates: { memberId: string; rotationOrder: number }[]) => {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      if (!rotationUpdates || rotationUpdates.length === 0) {
        throw new Error('No rotation updates provided');
      }
      
      // Validate all updates have valid member IDs
      const invalidUpdate = rotationUpdates.find(u => !u.memberId);
      if (invalidUpdate) {
        if (__DEV__) {
          console.error('Invalid rotation update found:', invalidUpdate);
        }
        throw new Error('Invalid member ID in rotation updates');
      }
      
      if (__DEV__) {
        console.log(`📝 Updating rotation order for group ${groupId} with ${rotationUpdates.length} members`);
      }
      
      // Try the dedicated bulk endpoint first
      try {
        const { data } = await api.put(`/groups/${groupId}/rotation-order`, { rotationUpdates });
        if (__DEV__) {
          console.log('✅ Bulk rotation order update successful');
        }
        return data;
      } catch (error: any) {
        if (__DEV__) {
          console.log('Bulk endpoint error:', {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }
        
        // If bulk endpoint doesn't exist (404 or 405), update each member individually
        if (error.response?.status === 404 || error.response?.status === 405) {
          if (__DEV__) {
            console.log('⚠️ Bulk endpoint not available, updating members individually...');
          }
          
          for (const update of rotationUpdates) {
            try {
              await api.patch(`/groups/${groupId}/members/${update.memberId}`, {
                rotationOrder: update.rotationOrder,
              });
              if (__DEV__) {
                console.log(`✓ Updated member ${update.memberId} to position ${update.rotationOrder}`);
              }
            } catch (memberError: any) {
              console.error(`Failed to update member ${update.memberId}:`, memberError);
              throw new Error(
                memberError.response?.data?.error || 
                memberError.response?.data?.message || 
                `Failed to update rotation order for a member`
              );
            }
          }
          if (__DEV__) {
            console.log('✅ All individual member updates successful');
          }
          return { success: true };
        }
        
        // For other errors, create a proper error with the message
        const errorMessage = 
          error.response?.data?.error || 
          error.response?.data?.message || 
          error.message || 
          'Failed to update rotation order';
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
    onError: (error) => {
      if (__DEV__) {
        console.error('❌ Rotation order mutation failed:', error);
      }
    },
  });
}
