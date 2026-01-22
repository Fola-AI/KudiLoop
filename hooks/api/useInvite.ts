import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { InviteInfo } from '@/types/api';

// Get public invite info (no auth required)
export function useInviteInfo(token: string) {
  return useQuery({
    queryKey: queryKeys.invite(token),
    queryFn: async () => {
      const { data } = await api.get<InviteInfo>(`/invite/${token}`);
      return data;
    },
    enabled: !!token,
    retry: false, // Don't retry invalid tokens
  });
}







