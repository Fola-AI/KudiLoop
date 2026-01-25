import { parseISO, format, isValid, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

/**
 * Safely parse a date string that works on both iOS and Android
 * Android's Hermes engine handles date strings differently than iOS's JavaScriptCore
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    // Try parseISO first (handles ISO 8601 format)
    let date = parseISO(dateString);
    
    // If invalid, try manual parsing
    if (!isValid(date)) {
      // Handle date-only strings like "2025-01-25"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        // Last resort: try native parsing
        date = new Date(dateString);
      }
    }
    
    return isValid(date) ? date : null;
  } catch (error) {
    console.warn('Date parsing failed:', dateString, error);
    return null;
  }
}

/**
 * Format date for activity display
 * Returns: "Today at 2:30 PM", "Yesterday at 10:15 AM", "Mon at 9:00 AM", "15 Jan 2025"
 */
export function formatActivityDate(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  
  if (!date) return '';
  
  try {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    if (isThisWeek(date)) {
      return format(date, "EEE 'at' h:mm a"); // "Mon at 9:00 AM"
    }
    
    return format(date, 'd MMM yyyy'); // "15 Jan 2025"
  } catch (error) {
    console.warn('Date formatting failed:', date, error);
    return '';
  }
}

/**
 * Format relative time: "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  
  if (!date) return '';
  
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return '';
  }
}

/**
 * Get date key for grouping activities by date
 */
export function getDateGroupKey(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  
  if (!date) return 'Unknown Date';
  
  try {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return 'This Week';
    return format(date, 'd MMMM yyyy');
  } catch (error) {
    return 'Unknown Date';
  }
}

/**
 * Get section title for activity grouping (more detailed than getDateGroupKey)
 * Returns weekday names for this week's items
 */
export function getActivitySectionTitle(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  
  if (!date) return 'Unknown Date';
  
  try {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE'); // Full weekday name
    return format(date, 'dd MMM yyyy'); // "25 Jan 2025"
  } catch (error) {
    return 'Unknown Date';
  }
}

/**
 * Get a unique date key for grouping (YYYY-MM-DD format)
 */
export function getDateKey(dateString: string | null | undefined): string {
  const date = parseDate(dateString);
  
  if (!date) return 'unknown';
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Safe date comparison for sorting (newest first)
 */
export function compareDates(a: string | null | undefined, b: string | null | undefined): number {
  const dateA = parseDate(a);
  const dateB = parseDate(b);
  
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  return dateB.getTime() - dateA.getTime();
}
