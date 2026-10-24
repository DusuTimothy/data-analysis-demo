/**
 * Trend responses only include periods that contain activity. Filling the gaps
 * with zero rows keeps the x-axis honest and prevents a line from implying data
 * that was never recorded.
 */

const PERIOD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_PERIODS = 1200;

function parsePeriod(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = PERIOD_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPeriod(date) {
  return date.toISOString().slice(0, 10);
}

function emptyPeriod(period) {
  return {
    period,
    total_activities: 0,
    total_contacts: 0,
    total_spend: 0,
    cost_per_contact: null,
  };
}

function advance(date, bucket) {
  if (bucket === 'week') {
    date.setUTCDate(date.getUTCDate() + 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
}

export function fillTrendPeriods(rows, bucket = 'month') {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const byPeriod = new Map(rows.map((row) => [row.period, row]));
  const dates = rows.map((row) => parsePeriod(row.period)).filter(Boolean);
  if (dates.length === 0) {
    return rows;
  }

  const first = new Date(Math.min(...dates.map((date) => date.getTime())));
  const last = Math.max(...dates.map((date) => date.getTime()));

  const filled = [];
  const cursor = new Date(first);
  let guard = 0;

  while (cursor.getTime() <= last && guard < MAX_PERIODS) {
    const period = formatPeriod(cursor);
    filled.push(byPeriod.get(period) ?? emptyPeriod(period));
    advance(cursor, bucket);
    guard += 1;
  }

  return filled;
}
