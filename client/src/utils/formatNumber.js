/**
 * Compact number and currency formatting for chart axes and tooltips.
 */

const compactNumberFormatter = new Intl.NumberFormat('en-NG', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCompactNumber(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  const number = Number(value);
  return Number.isFinite(number) ? compactNumberFormatter.format(number) : '—';
}

export function formatCompactCurrency(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  const number = Number(value);
  return Number.isFinite(number) ? compactCurrencyFormatter.format(number) : '—';
}
