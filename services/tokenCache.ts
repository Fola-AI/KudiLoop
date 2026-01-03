import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenCache } from '@clerk/clerk-expo';

/**
 * Secure token storage for Clerk
 * 
 * Uses expo-secure-store on native platforms (encrypted storage)
 * Falls back to localStorage on web (for testing only)
 */

const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        if (Platform.OS === 'web') {
          return localStorage.getItem(key);
        }
        
        const token = await SecureStore.getItemAsync(key);
        if (__DEV__ && token) {
          console.log('🔐 Token retrieved');
        }
        return token;
      } catch (error) {
        if (__DEV__) {
          console.error('Token retrieval error:', error);
        }
        return null;
      }
    },
    
    async saveToken(key: string, value: string) {
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem(key, value);
          return;
        }
        
        await SecureStore.setItemAsync(key, value);
        if (__DEV__) {
          console.log('🔐 Token saved');
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Token save error:', error);
        }
      }
    },
    
    async clearToken(key: string) {
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem(key);
          return;
        }
        
        await SecureStore.deleteItemAsync(key);
        if (__DEV__) {
          console.log('🔐 Token cleared');
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Token clear error:', error);
        }
      }
    },
  };
};

export const tokenCache = createTokenCache();
