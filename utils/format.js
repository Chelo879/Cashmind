/**
 * Format a number as Mexican Peso currency.
 * e.g. 18450 → "$18,450.00"
 */
export const fmt = (n) =>
  '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Return a percentage string rounded to 0 decimals.
 * e.g. pct(3200, 5000) → "64%"
 */
export const pct = (partial, total) =>
  total === 0 ? '0%' : `${Math.round((partial / total) * 100)}%`;

/**
 * Return a 0-1 fraction clamped between 0 and 1.
 */
export const fraction = (partial, total) =>
  total === 0 ? 0 : Math.min(1, Math.max(0, partial / total));
