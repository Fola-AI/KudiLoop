type CurrencyCode = "NGN" | "GBP" | "USD" | "EUR" | "CAD";

const currencyConfig: Record<CurrencyCode, { symbol: string; locale: string }> = {
  NGN: { symbol: "₦", locale: "en-NG" },
  GBP: { symbol: "£", locale: "en-GB" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  CAD: { symbol: "C$", locale: "en-CA" },
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "NGN",
  options?: { showSymbol?: boolean; compact?: boolean }
): string {
  const { showSymbol = true, compact = false } = options || {};
  const config = currencyConfig[currency];

  if (compact && amount >= 1000) {
    const formatter = new Intl.NumberFormat(config.locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    const formatted = formatter.format(amount);
    return showSymbol ? `${config.symbol}${formatted}` : formatted;
  }

  const formatter = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(amount);
  return showSymbol ? `${config.symbol}${formatted}` : formatted;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return currencyConfig[currency].symbol;
}

/**
 * Abbreviate large numbers by TRUNCATING (not rounding).
 * 
 * Examples:
 * - 7,257,676 → "7.2M" (NOT "7.3M")
 * - 7,999,999 → "7.9M" (NOT "8M")
 * - 1,567,000 → "1.5M" (NOT "1.6M")
 * - 26,200,000 → "26.2M"
 * - 1,500,000,000 → "1.5B"
 */
export function abbreviateAmount(amount: number): string {
  if (amount === 0) return '0';
  
  // Billions (1,000,000,000+)
  if (amount >= 1_000_000_000) {
    // Truncate to 1 decimal place: divide by 100M, floor, then divide by 10
    const truncated = Math.floor(amount / 100_000_000) / 10;
    // Remove trailing .0
    return truncated.toString().replace(/\.0$/, '') + 'B';
  }
  
  // Millions (1,000,000+)
  if (amount >= 1_000_000) {
    // Truncate to 1 decimal place: divide by 100K, floor, then divide by 10
    const truncated = Math.floor(amount / 100_000) / 10;
    // Remove trailing .0
    return truncated.toString().replace(/\.0$/, '') + 'M';
  }
  
  // Thousands (1,000+)
  if (amount >= 1_000) {
    // Truncate to 1 decimal place: divide by 100, floor, then divide by 10
    const truncated = Math.floor(amount / 100) / 10;
    // Remove trailing .0
    return truncated.toString().replace(/\.0$/, '') + 'K';
  }
  
  // Under 1,000: return as integer
  return Math.floor(amount).toString();
}

/**
 * Format amount with currency symbol (abbreviated, truncated).
 * 
 * Examples:
 * - (7257676, "NGN") → "₦7.2M"
 * - (1567000, "USD") → "$1.5M"
 */
export function formatCurrencyAbbreviated(
  amount: number,
  currency: CurrencyCode = "NGN"
): string {
  const symbol = currencyConfig[currency].symbol;
  return `${symbol}${abbreviateAmount(amount)}`;
}

