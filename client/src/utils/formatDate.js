/**
 * Formats ISO date-only strings in the campaign timezone without shifting the
 * calendar day for users located west of Lagos.
 */

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
});

export function formatDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '—';
  }
  const date = new Date(`${value}T00:00:00+01:00`);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}

export function formatDateTime(value) {
  if (typeof value !== 'string' || value === '') {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateTimeFormatter.format(date);
}
