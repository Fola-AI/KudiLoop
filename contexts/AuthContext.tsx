import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, setTokenRefresher } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { User } from '@/types/api';
import api from '@/services/api';

interface AuthContextType {
  // Auth state
  isSignedIn: boolean;
  isLoaded: boolean;
  isAuthenticating: boolean;
  setIsAuthenticating: (value: boolean) => void;
  
  // Clerk user data
  clerkUser: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  } | null;
  
  // User from KudiLoop database
  user: User | null;
  isLoadingUser: boolean;
  userError: string | null;
  
  // Actions
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUserData } = useClerkUser();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Track if we've already fetched for this session
  const hasFetchedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  
  // Store getToken ref for the token refresher
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // Format Clerk user for easy access
  const clerkUser = clerkUserData ? {
    id: clerkUserData.id,
    email: clerkUserData.primaryEmailAddress?.emailAddress || null,
    firstName: clerkUserData.firstName,
    lastName: clerkUserData.lastName,
    imageUrl: clerkUserData.imageUrl,
  } : null;

  // Set up the token refresher for automatic 401 retry
  useEffect(() => {
    const tokenRefreshFunction = async (): Promise<string | null> => {
      try {
        // Force get a fresh token from Clerk
        const token = await getTokenRef.current({ skipCache: true });
        if (__DEV__) {
          console.log('🔐 Token refreshed via Clerk');
        }
        return token;
      } catch (error) {
        if (__DEV__) {
          console.error('🔐 Failed to refresh token from Clerk:', error);
        }
        return null;
      }
    };
    
    setTokenRefresher(tokenRefreshFunction);
  }, []);

  // Fetch user from KudiLoop backend
  const fetchUser = useCallback(async (force = false) => {
    // Don't fetch if already fetched (unless forced) or fetch in progress
    if ((!force && hasFetchedRef.current) || fetchInProgressRef.current) {
      return;
    }
    
    if (!isSignedIn) {
      setUser(null);
      setAuthToken(null);
      setUserError(null);
      hasFetchedRef.current = false;
      return;
    }

    fetchInProgressRef.current = true;

    try {
      setIsLoadingUser(true);
      setUserError(null);
      
      // Get Clerk session token (fresh)
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('No session token available');
      }
      
      // Set token for API calls
      setAuthToken(token);
      
      // Fetch/create user in our database
      const response = await api.get<User>('/auth/user');
      setUser(response.data);
      hasFetchedRef.current = true;
      
      if (__DEV__) {
        console.log('👤 User loaded:', response.data.email);
        console.log('👤 User avatarChoice:', response.data.avatarChoice);
        console.log('👤 User profileImageUrl:', response.data.profileImageUrl);
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      setUserError(error.message || 'Failed to load user');
      setUser(null);
      hasFetchedRef.current = true; // Mark as fetched even on error to prevent retry loop
    } finally {
      setIsLoadingUser(false);
      fetchInProgressRef.current = false;
    }
  }, [isSignedIn, getToken]);

  // Fetch user ONCE when auth state changes to signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && !hasFetchedRef.current) {
      fetchUser();
    } else if (isLoaded && !isSignedIn) {
      // Reset state on sign out
      setUser(null);
      setUserError(null);
      hasFetchedRef.current = false;
    }
  }, [isLoaded, isSignedIn]); // Removed fetchUser from deps to prevent loop

  // Keep token fresh proactively (Clerk tokens expire after ~60 seconds in dev)
  useEffect(() => {
    if (!isSignedIn) return;

    const refreshToken = async () => {
      try {
        const token = await getToken({ skipCache: true });
        if (token) {
          setAuthToken(token);
          if (__DEV__) {
            console.log('🔐 Proactive token refresh');
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // In development, Clerk tokens expire quickly (~60 seconds)
    // Refresh every 45 seconds to stay ahead
    const refreshInterval = __DEV__ ? 45 * 1000 : 50 * 60 * 1000;
    const interval = setInterval(refreshToken, refreshInterval);
    
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  // Sign out
  const handleSignOut = async () => {
    try {
      if (__DEV__) console.log('🚪 Logging out - clearing cache');
      
      // Clear React Query memory cache BEFORE signing out
      // This prevents stale data from appearing for the next user
      queryClient.clear();
      
      // Clear persisted cache from AsyncStorage
      // The key matches what's defined in services/queryClient.ts
      await AsyncStorage.removeItem('kudiloop-query-cache');
      
      // Sign out from Clerk
      await clerkSignOut();
      
      // Reset local state
      setUser(null);
      setAuthToken(null);
      setUserError(null);
      hasFetchedRef.current = false;
      
      if (__DEV__) console.log('✅ Logout complete - cache cleared');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Manual refresh (forces a new fetch)
  const refreshUser = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchUser(true);
  }, [fetchUser]);

  const value: AuthContextType = {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    isAuthenticating,
    setIsAuthenticating,
    clerkUser,
    user,
    isLoadingUser,
    userError,
    refreshUser,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
