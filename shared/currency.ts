/**
 * Currency utilities for Kenyan Shillings (KES)
 */

export const CURRENCY = {
  code: "KES",
  symbol: "Ksh",
  name: "Kenyan Shilling",
};

/**
 * Format a number as Kenyan Shillings
 * @param amount - The amount in KES
 * @returns Formatted string like "Ksh 1,234.50"
 */
export function formatKES(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${CURRENCY.symbol} ${num.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number as Kenyan Shillings (compact, no symbol)
 * @param amount - The amount in KES
 * @returns Formatted string like "1,234.50"
 */
export function formatKESCompact(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
