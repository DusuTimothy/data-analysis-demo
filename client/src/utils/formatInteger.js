/**
 * Groups whole numbers for readable contact and activity counts.
 */

const integerFormatter = new Intl.NumberFormat('en-NG');

export function formatInteger(value) {
  if (value === null || value === undefined) {
    return '—';
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '—';
  }
  return integerFormatter.format(number);
}
