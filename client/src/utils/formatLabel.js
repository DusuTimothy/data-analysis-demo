/**
 * Human-readable labels for grouped values and trend periods.
 */

const monthFormatter = new Intl.DateTimeFormat('en-NG', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});

const weekFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});

export function formatActivityType(value) {
  if (!value) {
    return '—';
  }
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatGroupValue(value, groupBy) {
  if (value === null || value === undefined || value === '') {
    return '(not recorded)';
  }
  if (groupBy === 'activity_type') {
    return formatActivityType(value);
  }
  return String(value);
}

export function formatPeriodLabel(value, bucket) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '—';
  }
  const date = new Date(`${value}T00:00:00+01:00`);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return bucket === 'week' ? weekFormatter.format(date) : monthFormatter.format(date);
}
