import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { Activity } from '@/types/api';

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: async () => {
      const { data } = await api.get<Activity[]>('/activity/recent');
      return data;
    },
  });
}
