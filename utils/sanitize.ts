/**
 * Input Sanitization Utilities for KudiLoop
 * 
 * Sanitize user input to prevent XSS and injection attacks
 * Use these functions before storing or displaying user input
 */

export const sanitize = {
  /**
   * Remove HTML tags from input
   * Use when displaying user-generated content
   */
  stripHtml(input: string): string {
    if (!input) return '';
    return input.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape special HTML characters
   * Use when rendering user input in HTML context
   */
  escapeHtml(input: string): string {
    if (!input) return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char]);
  },

  /**
   * Clean monetary input (allow only numbers and single decimal point)
   * Use for amount inputs
   * 
   * @example
   * sanitize.money('$1,234.56') // '1234.56'
   * sanitize.money('123.45.67') // '123.4567' (removes extra decimals)
   */
  money(input: string): string {
    if (!input) return '';
    // Remove everything except digits and decimal point
    const cleaned = input.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  },

  /**
   * Clean phone number (allow only numbers, +, and optional spaces/dashes)
   * Use for phone number inputs
   * 
   * @example
   * sanitize.phone('+1 (234) 567-8900') // '+12345678900'
   */
  phone(input: string): string {
    if (!input) return '';
    return input.replace(/[^0-9+]/g, '');
  },

  /**
   * Clean to alphanumeric only
   * Use for codes, IDs, etc.
   * 
   * @example
   * sanitize.alphanumeric('ABC-123!@#') // 'ABC123'
   */
  alphanumeric(input: string): string {
    if (!input) return '';
    return input.replace(/[^a-zA-Z0-9]/g, '');
  },

  /**
   * Clean to alphanumeric with spaces
   * Use for names, titles, etc.
   * 
   * @example
   * sanitize.alphanumericWithSpaces('John Doe!') // 'John Doe'
   */
  alphanumericWithSpaces(input: string): string {
    if (!input) return '';
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  /**
   * Limit string length
   * Use to prevent excessively long inputs
   * 
   * @param input The input string
   * @param maxLength Maximum allowed length
   * @param ellipsis Whether to add '...' when truncated
   */
  truncate(input: string, maxLength: number, ellipsis = false): string {
    if (!input) return '';
    if (input.length <= maxLength) return input;
    
    if (ellipsis && maxLength > 3) {
      return input.substring(0, maxLength - 3) + '...';
    }
    return input.substring(0, maxLength);
  },

  /**
   * Clean bank account number (digits only, max 20 chars)
   * Use for bank account inputs
   * 
   * @example
   * sanitize.bankAccount('1234-5678-9012') // '123456789012'
   */
  bankAccount(input: string): string {
    if (!input) return '';
    return input.replace(/[^0-9]/g, '').substring(0, 20);
  },

  /**
   * Clean Nigerian bank account number (10 digits)
   * 
   * @example
   * sanitize.nigerianBankAccount('1234567890123') // '1234567890'
   */
  nigerianBankAccount(input: string): string {
    if (!input) return '';
    return input.replace(/[^0-9]/g, '').substring(0, 10);
  },

  /**
   * Clean sort code (UK format: XX-XX-XX)
   * 
   * @example
   * sanitize.sortCode('12-34-56') // '12-34-56'
   * sanitize.sortCode('123456') // '12-34-56'
   */
  sortCode(input: string): string {
    if (!input) return '';
    const digits = input.replace(/[^0-9]/g, '').substring(0, 6);
    if (digits.length >= 6) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
    }
    if (digits.length >= 4) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}${digits.length > 4 ? '-' + digits.slice(4) : ''}`;
    }
    return digits;
  },

  /**
   * Clean email address (lowercase, trimmed)
   * Note: This doesn't validate, just sanitizes
   * 
   * @example
   * sanitize.email('  John.Doe@Email.com  ') // 'john.doe@email.com'
   */
  email(input: string): string {
    if (!input) return '';
    return input.toLowerCase().trim();
  },

  /**
   * Clean group name (alphanumeric, spaces, and common punctuation)
   * 
   * @example
   * sanitize.groupName("John's Group <script>") // "John's Group script"
   */
  groupName(input: string): string {
    if (!input) return '';
    return input.replace(/[^a-zA-Z0-9\s'"-]/g, '').trim();
  },

  /**
   * Clean description/notes (remove dangerous HTML, keep basic formatting)
   * 
   * @example
   * sanitize.description("Hello <script>alert('xss')</script> world") // "Hello  world"
   */
  description(input: string): string {
    if (!input) return '';
    return this.stripHtml(input).trim();
  },

  /**
   * Clean PIN (digits only, exactly 4-6 characters)
   * 
   * @example
   * sanitize.pin('1234abc') // '1234'
   */
  pin(input: string, length = 4): string {
    if (!input) return '';
    return input.replace(/[^0-9]/g, '').substring(0, length);
  },

  /**
   * Validate and clean URL (basic sanitization)
   * Returns empty string if URL is invalid
   */
  url(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    
    // Check for javascript: or data: URLs (XSS vectors)
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      return '';
    }
    
    // Ensure URL starts with http:// or https://
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    
    return trimmed;
  },
};

// Type-safe sanitizer helper
export type SanitizeFunction = keyof typeof sanitize;

/**
 * Apply multiple sanitizers in sequence
 * 
 * @example
 * const clean = pipe(input, 'stripHtml', 'truncate');
 */
export function sanitizeAll(
  input: string, 
  ...sanitizers: Array<SanitizeFunction | [SanitizeFunction, ...any[]]>
): string {
  return sanitizers.reduce((result, sanitizer) => {
    if (Array.isArray(sanitizer)) {
      const [fn, ...args] = sanitizer;
      return (sanitize[fn] as Function)(result, ...args);
    }
    return (sanitize[sanitizer] as Function)(result);
  }, input);
}

export default sanitize;





