import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { config, isDev } from '@/config/env';
import { ApiError } from '@/types/api';

/**
 * Axios API client for KudiLoop
 * 
 * Features:
 * - Automatic auth token attachment
 * - Automatic token refresh on 401
 * - Request/response logging in dev only
 * - Global error handling
 * - Timeout configuration
 * - Offline-aware error suppression
 * - Security headers
 */

// App version for tracking (update with releases)
const APP_VERSION = '1.0.0';

// Track offline state to suppress expected errors
let isOffline = false;

// Subscribe to network state changes
NetInfo.addEventListener((state) => {
  isOffline = !state.isConnected || !state.isInternetReachable;
});

// Create axios instance with secure defaults
const api: AxiosInstance = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: config.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': APP_VERSION,
    'X-Platform': 'mobile',
  },
});

// Token storage
let authToken: string | null = null;

// Token refresh function - will be set by AuthContext
let tokenRefresher: (() => Promise<string | null>) | null = null;

// Track if we're currently refreshing to prevent multiple refreshes
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

/**
 * Set the auth token for all future requests
 * Called by AuthContext when user signs in
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (isDev) {
    console.log(token ? '🔐 Auth token set' : '🔓 Auth token cleared');
  }
};

export const getAuthToken = () => authToken;

/**
 * Set the token refresh function
 * Called by AuthContext to enable automatic token refresh
 */
export const setTokenRefresher = (refresher: () => Promise<string | null>) => {
  tokenRefresher = refresher;
};

/**
 * Subscribe to token refresh completion
 */
const subscribeToTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token refresh completes
 */
const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh the auth token
 */
const refreshToken = async (): Promise<string | null> => {
  if (!tokenRefresher) {
    if (isDev) {
      console.log('🔐 No token refresher available');
    }
    return null;
  }

  try {
    const newToken = await tokenRefresher();
    if (newToken) {
      setAuthToken(newToken);
      if (isDev) {
        console.log('🔐 Token refreshed successfully');
      }
    }
    return newToken;
  } catch (error) {
    if (isDev) {
      console.error('🔐 Token refresh failed:', error);
    }
    return null;
  }
};

// Request interceptor
api.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    // Check network before making request
    if (isOffline) {
      if (isDev) {
        console.log('🔌 Request blocked - offline');
      }
      throw new Error('OFFLINE');
    }
    
    // Attach auth token if available
    if (authToken) {
      requestConfig.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Log requests in development only
    if (isDev) {
      const method = requestConfig.method?.toUpperCase();
      const url = requestConfig.url;
      console.log(`🌐 ${method} ${url}`);
    }
    
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`✅ ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if this is a network error - suppress logging for all network errors
    // Network errors are expected in mobile apps (connectivity changes, server issues, etc.)
    const isNetworkError = !error.response;
    // Suppress network errors always to avoid flooding logs and showing errors to users
    const shouldSuppressError = isNetworkError;
    
    // Handle 401 - attempt to refresh token and retry (only when online)
    if (!isOffline && error.response?.status === 401 && !originalRequest._retry && tokenRefresher) {
      if (isRefreshing) {
        // If already refreshing, wait for the refresh to complete
        return new Promise((resolve, reject) => {
          subscribeToTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        onTokenRefreshed(null);
        if (isDev) {
          console.error('🔐 Token refresh failed during retry:', refreshError);
        }
      }
    }
    
    // Only log server errors (non-network errors) in dev mode
    // Use console.log instead of console.error to avoid triggering error overlays
    if (isDev && !shouldSuppressError) {
      console.log(`⚠️ ${error.config?.url} - ${error.response?.status}`);
      // Don't log full error data - may contain sensitive info
    }
    
    // Handle specific error codes (only log when online and in dev)
    const status = error.response?.status;
    
    if (status === 401 && !isOffline && isDev) {
      console.log('🔐 Session expired - refresh failed or not available');
    }
    
    if (status === 403 && !isOffline && isDev) {
      console.log('🚫 Permission denied');
    }
    
    if (status === 404 && !isOffline && isDev) {
      console.log('🔍 Resource not found');
    }
    
    // Network errors are now suppressed - no logging needed
    
    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message from an API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    
    // Server returned an error message
    if (apiError?.error) {
      return apiError.error;
    }
    if (apiError?.message) {
      return apiError.message;
    }
    
    // Network error - check if offline
    if (!error.response) {
      if (isOffline) {
        return 'You\'re offline. This action will sync when you\'re back online.';
      }
      return 'Unable to connect to server. Please check your internet connection.';
    }
    
    // HTTP status errors
    switch (error.response.status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to do that.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Server error (${error.response.status})`;
    }
  }
  
  // Non-Axios error
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if the device is currently offline
 */
export const isDeviceOffline = (): boolean => isOffline;

/**
 * Convert a relative API URL to an absolute URL
 * Handles both relative paths (e.g., /uploads/avatars/...) and full URLs
 */
export const getAbsoluteUrl = (relativeUrl: string | null | undefined): string | null => {
  if (!relativeUrl) return null;
  
  // Already an absolute URL (http://, https://, file://, data:, or DiceBear API)
  if (relativeUrl.startsWith('http://') || 
      relativeUrl.startsWith('https://') || 
      relativeUrl.startsWith('file://') ||
      relativeUrl.startsWith('data:') ||
      relativeUrl.includes('api.dicebear.com')) {
    return relativeUrl;
  }
  
  // Relative URL - prepend API base URL
  const baseUrl = config.apiUrl;
  const cleanRelative = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;
  return `${baseUrl}${cleanRelative}`;
};

export default api;
