/**
 * Safe Logging Utility for KudiLoop
 * 
 * All logs are only output in development mode (__DEV__)
 * This prevents sensitive information from being logged in production
 * 
 * @example
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('User signed in');
 * logger.error('Failed to fetch data:', error);
 * logger.warn('Deprecated method used');
 * logger.info('App initialized');
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

// Prefix for all logs to easily identify KudiLoop logs
const LOG_PREFIX = '[KudiLoop]';

// Emoji prefixes for visual distinction in dev
const LEVEL_EMOJI: Record<LogLevel, string> = {
  log: '📝',
  warn: '⚠️',
  error: '❌',
  info: 'ℹ️',
  debug: '🔍',
};

/**
 * Safe console wrapper that only logs in development
 */
const safeLog = (level: LogLevel, ...args: unknown[]) => {
  if (__DEV__) {
    const emoji = LEVEL_EMOJI[level];
    const prefix = `${emoji} ${LOG_PREFIX}`;
    
    switch (level) {
      case 'log':
        console.log(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'debug':
        console.debug(prefix, ...args);
        break;
    }
  }
};

export const logger = {
  /**
   * General purpose logging
   */
  log: (...args: unknown[]) => safeLog('log', ...args),
  
  /**
   * Warning messages
   */
  warn: (...args: unknown[]) => safeLog('warn', ...args),
  
  /**
   * Error messages
   */
  error: (...args: unknown[]) => safeLog('error', ...args),
  
  /**
   * Informational messages
   */
  info: (...args: unknown[]) => safeLog('info', ...args),
  
  /**
   * Debug messages (more verbose)
   */
  debug: (...args: unknown[]) => safeLog('debug', ...args),

  /**
   * Log with a custom tag for easier filtering
   */
  tag: (tag: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(`📌 ${LOG_PREFIX} [${tag}]`, ...args);
    }
  },

  /**
   * Log an API request
   */
  api: (method: string, url: string, status?: number) => {
    if (__DEV__) {
      const emoji = status && status >= 400 ? '❌' : '🌐';
      console.log(`${emoji} ${method} ${url}${status ? ` - ${status}` : ''}`);
    }
  },

  /**
   * Log a security-related event
   */
  security: (...args: unknown[]) => {
    if (__DEV__) {
      console.log(`🔐 ${LOG_PREFIX} [Security]`, ...args);
    }
  },

  /**
   * Group related logs together (collapses in console)
   */
  group: (label: string, fn: () => void) => {
    if (__DEV__) {
      console.group(`${LOG_PREFIX} ${label}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  },

  /**
   * Time an operation
   */
  time: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (__DEV__) {
      const start = performance.now();
      try {
        const result = await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`⏱️ ${LOG_PREFIX} ${label} took ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        console.error(`⏱️ ${LOG_PREFIX} ${label} failed after ${duration}ms`, error);
        throw error;
      }
    } else {
      return fn();
    }
  },
};

export default logger;






