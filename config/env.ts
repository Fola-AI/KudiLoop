/**
 * Environment configuration for KudiLoop
 * 
 * IMPORTANT: Never commit actual secrets to this file
 * Use EAS Secrets for production values
 * 
 * Reads from environment variables (.env file)
 * Uses EXPO_PUBLIC_ prefix for client-accessible variables
 */

type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  apiUrl: string;
  clerkPublishableKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  environment: Environment;
  enableLogging: boolean;
  sentryDsn?: string;
  sessionTimeoutMs: number;
  apiTimeoutMs: number;
}

// Determine environment based on Expo constants
const getEnvironment = (): Environment => {
  // Check for __DEV__ first
  if (__DEV__) return 'development';
  
  // Use EXPO_PUBLIC_ENV for EAS builds
  const env = process.env.EXPO_PUBLIC_ENV as Environment;
  return env || 'production';
};

// Environment variables with fallbacks
// NOTE for local development:
// - iOS Simulator: http://localhost:3000 works
// - Android Emulator: use http://10.0.2.2:3000 (emulator's host loopback)
// - Physical devices: use your machine's IP, e.g., http://192.168.x.x:3000
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kudiloop.com';
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dv5up7vpe';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kudiloop_receipts';

const configs: Record<Environment, EnvironmentConfig> = {
  development: {
    apiUrl: API_URL,
    clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
    cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
    cloudinaryUploadPreset: CLOUDINARY_UPLOAD_PRESET,
    environment: 'development',
    enableLogging: true,
    sessionTimeoutMs: 15 * 60 * 1000, // 15 minutes in dev
    apiTimeoutMs: 30000,
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_STAGING_API_URL || 'https://kudiloop.com',
    clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
    cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
    cloudinaryUploadPreset: CLOUDINARY_UPLOAD_PRESET,
    environment: 'staging',
    enableLogging: true,
    sessionTimeoutMs: 5 * 60 * 1000, // 5 minutes
    apiTimeoutMs: 30000,
  },
  production: {
    apiUrl: 'https://kudiloop.com',
    clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
    cloudinaryCloudName: CLOUDINARY_CLOUD_NAME,
    cloudinaryUploadPreset: CLOUDINARY_UPLOAD_PRESET,
    environment: 'production',
    enableLogging: false,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sessionTimeoutMs: 5 * 60 * 1000, // 5 minutes
    apiTimeoutMs: 30000,
  },
};

const currentEnv = getEnvironment();
export const config = configs[currentEnv];

// Backwards compatibility exports
export const env = {
  // API
  apiUrl: config.apiUrl,
  
  // Clerk (publishable key only - safe for client)
  clerkPublishableKey: config.clerkPublishableKey,
  
  // Cloudinary (public values only)
  cloudinaryCloudName: config.cloudinaryCloudName,
  cloudinaryUploadPreset: config.cloudinaryUploadPreset,
  
  // Environment info
  environment: config.environment,
  isDev: config.environment === 'development',
  
  // Helper function
  getApiUrl: () => config.apiUrl,
};

// Type-safe environment checks
export const isDev = config.environment === 'development';
export const isStaging = config.environment === 'staging';
export const isProd = config.environment === 'production';

// Cloudinary upload URL helper
export const getCloudinaryUploadUrl = () => 
  `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`;

// Log environment in development only
if (isDev) {
  console.log('🔧 Environment:', config.environment);
  console.log('🔧 API URL:', config.apiUrl);
  console.log('🔧 Clerk Key:', config.clerkPublishableKey ? '✓ Loaded' : '✗ Missing');
  console.log('🔧 Session Timeout:', config.sessionTimeoutMs / 1000 / 60, 'minutes');
}

export default env;
