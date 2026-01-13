import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/services/api';
import { queryKeys } from '@/services/queryClient';
import { User, UserSettings, UpdateProfilePayload } from '@/types/api';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/user');
      return data;
    },
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const { data } = await api.get<UserSettings>('/settings');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await api.patch<User>('/profile', payload);
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user, updatedUser);
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<UserSettings>) => {
      const { data } = await api.patch<UserSettings>('/settings', payload);
      return data;
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(queryKeys.settings, updatedSettings);
    },
  });
}

// Upload profile photo (goes through backend)
export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (__DEV__) {
        console.log('📸 Uploading profile photo:', imageUri);
      }
      
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Field name must match backend multer config: uploadAvatar.single('avatar')
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      
      if (__DEV__) {
        console.log('📸 FormData created with:', { filename, type });
      }
      
      // Use same pattern as working receipt uploads in useContributions
      const { data } = await api.post('/users/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 seconds for file uploads
      });
      
      if (__DEV__) {
        console.log('📸 Upload response:', data);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

// Delete user account (Apple App Store requirement)
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (__DEV__) {
        console.log('🗑️ Deleting user account...');
      }
      
      const { data } = await api.delete('/account');
      
      if (__DEV__) {
        console.log('🗑️ Account deletion response:', data);
      }
      
      return data;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

// Helper to check if running in dev mode
declare const __DEV__: boolean;
