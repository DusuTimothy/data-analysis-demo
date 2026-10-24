/**
 * Formats NGN values for the dashboard. Missing or invalid values render as an
 * em dash so a zero-cost edge case is never mistaken for zero naira.
 */

const ngnFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '—';
  }
  return ngnFormatter.format(number);
}
