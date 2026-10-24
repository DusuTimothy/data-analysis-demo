/**
 * Campaign aggregation rules: validation, decimal normalization, and the
 * cost-per-contact edge case. Kept independent of HTTP and Sequelize.
 */

import { AppError } from '../errors/AppError.js';
import { ACTIVITY_TYPES, GROUP_BY_VALUES, TREND_BUCKETS } from '../config/campaign.js';

function roundToTwoDecimals(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildAggregate(row) {
  const totalActivities = toNumber(row.total_activities);
  const totalContacts = toNumber(row.total_contacts);
  const totalSpend = roundToTwoDecimals(toNumber(row.total_spend));

  return {
    totalActivities,
    totalContacts,
    totalSpend,
    // node-postgres returns SUM/COUNT aggregates as strings, so every value
    // above is normalized before it can reach the response.
    costPerContact: totalContacts > 0 ? roundToTwoDecimals(totalSpend / totalContacts) : null,
  };
}

function normalizeTrendRow(row) {
  return {
    period: String(row.period),
    ...buildAggregate(row),
  };
}

function normalizeCoverageRow(row) {
  return {
    lga: String(row.lga),
    activityType: String(row.activity_type),
    ...buildAggregate(row),
  };
}

function normalizeGroupedRow(row) {
  // polling_unit is nullable upstream, so a valid grouping can contain a NULL
  // bucket. Label it explicitly instead of failing the whole report.
  const group = row.group === null || row.group === undefined ? '(not recorded)' : String(row.group);
  return {
    group,
    ...buildAggregate(row),
  };
}

function isIsoDate(value) {
  if (value === undefined) {
    return true;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function createAnalyticsService({ repository, lgas }) {
  if (!repository) {
    throw new Error('createAnalyticsService requires a repository.');
  }

  const knownLgas = new Set(lgas);
  const knownGroupings = new Set(GROUP_BY_VALUES);
  const knownActivityTypes = new Set(ACTIVITY_TYPES);

  function validateQuery(query) {
    if (!knownGroupings.has(query.groupBy)) {
      throw AppError.badRequest(
        `group_by must be one of: ${GROUP_BY_VALUES.join(', ')}.`,
      );
    }
    if (query.lga !== undefined && !knownLgas.has(query.lga)) {
      throw AppError.badRequest('lga must be one of the configured senatorial district LGAs.');
    }
    if (query.activityType !== undefined && !knownActivityTypes.has(query.activityType)) {
      throw AppError.badRequest(
        `activity_type must be one of: ${ACTIVITY_TYPES.join(', ')}.`,
      );
    }
    if (!isIsoDate(query.from) || !isIsoDate(query.to)) {
      throw AppError.badRequest('from and to must use the YYYY-MM-DD format.');
    }
    if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
      throw AppError.badRequest('from must be earlier than or equal to to.');
    }
  }

  async function getSummary(query) {
    validateQuery(query);

    const [groupedRows, totalsRow] = await Promise.all([
      repository.getGroupedSummary(query),
      repository.getTotals(query),
    ]);

    return {
      rows: groupedRows.map((row) => normalizeGroupedRow(row)),
      totals: buildAggregate(totalsRow),
    };
  }

  async function getTrend(query) {
    validateQuery(query);
    if (!TREND_BUCKETS.includes(query.bucket)) {
      throw AppError.badRequest(`bucket must be one of: ${TREND_BUCKETS.join(', ')}.`);
    }

    const [trendRows, totalsRow] = await Promise.all([
      repository.getTrend(query),
      repository.getTotals(query),
    ]);

    return {
      rows: trendRows.map((row) => normalizeTrendRow(row)),
      totals: buildAggregate(totalsRow),
    };
  }

  async function getCoverage(query) {
    validateQuery(query);

    const [coverageRows, totalsRow] = await Promise.all([
      repository.getCoverage(query),
      repository.getTotals(query),
    ]);

    return {
      rows: coverageRows.map((row) => normalizeCoverageRow(row)),
      totals: buildAggregate(totalsRow),
    };
  }

  return { getSummary, getTrend, getCoverage };
}
