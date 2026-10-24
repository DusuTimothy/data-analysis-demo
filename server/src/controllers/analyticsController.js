/**
 * Maps validated query input to the analytics service and shapes the single
 * public response contract. No database access happens here.
 */

import { CURRENCY } from '../config/campaign.js';

function buildContext(campaignConfig) {
  return {
    candidate: campaignConfig.candidateName,
    party: campaignConfig.partyName,
    senatorial_district: campaignConfig.senatorialDistrict,
    election_year: campaignConfig.electionYear,
    lgas: campaignConfig.lgas,
    activity_types: campaignConfig.activityTypes,
  };
}

function buildFilters(filters) {
  return {
    lga: filters.lga ?? null,
    ward: filters.ward ?? null,
    activity_type: filters.activityType ?? null,
    from: filters.from ?? null,
    to: filters.to ?? null,
  };
}

function buildTotals(totals) {
  return {
    total_activities: totals.totalActivities,
    total_contacts: totals.totalContacts,
    total_spend: totals.totalSpend,
    cost_per_contact: totals.costPerContact,
  };
}

export function toSummaryResponse({ campaignConfig, filters, result }) {
  return {
    context: buildContext(campaignConfig),
    filters: {
      group_by: filters.groupBy,
      ...buildFilters(filters),
    },
    currency: CURRENCY,
    data: result.rows.map((row) => ({
      group: row.group,
      total_activities: row.totalActivities,
      total_contacts: row.totalContacts,
      total_spend: row.totalSpend,
      cost_per_contact: row.costPerContact,
    })),
    totals: buildTotals(result.totals),
    generated_at: new Date().toISOString(),
  };
}

export function toTrendResponse({ campaignConfig, filters, result }) {
  return {
    context: buildContext(campaignConfig),
    filters: {
      bucket: filters.bucket,
      ...buildFilters(filters),
    },
    currency: CURRENCY,
    data: result.rows.map((row) => ({
      period: row.period,
      total_activities: row.totalActivities,
      total_contacts: row.totalContacts,
      total_spend: row.totalSpend,
      cost_per_contact: row.costPerContact,
    })),
    totals: buildTotals(result.totals),
    generated_at: new Date().toISOString(),
  };
}

export function toCoverageResponse({ campaignConfig, filters, result }) {
  return {
    context: buildContext(campaignConfig),
    filters: buildFilters(filters),
    currency: CURRENCY,
    data: result.rows.map((row) => ({
      lga: row.lga,
      activity_type: row.activityType,
      total_activities: row.totalActivities,
      total_contacts: row.totalContacts,
      total_spend: row.totalSpend,
      cost_per_contact: row.costPerContact,
    })),
    totals: buildTotals(result.totals),
    generated_at: new Date().toISOString(),
  };
}

export function toContextResponse(campaignConfig) {
  return {
    context: buildContext(campaignConfig),
    currency: CURRENCY,
    generated_at: new Date().toISOString(),
  };
}

export function createAnalyticsController({ analyticsService, campaignConfig }) {
  async function getSummary(req, res, next) {
    try {
      const result = await analyticsService.getSummary(req.validatedQuery);
      res.json(toSummaryResponse({ campaignConfig, filters: req.validatedQuery, result }));
    } catch (error) {
      next(error);
    }
  }

  async function getTrend(req, res, next) {
    try {
      const result = await analyticsService.getTrend(req.validatedQuery);
      res.json(toTrendResponse({ campaignConfig, filters: req.validatedQuery, result }));
    } catch (error) {
      next(error);
    }
  }

  async function getCoverage(req, res, next) {
    try {
      const result = await analyticsService.getCoverage(req.validatedQuery);
      res.json(toCoverageResponse({ campaignConfig, filters: req.validatedQuery, result }));
    } catch (error) {
      next(error);
    }
  }

  function getContext(_req, res) {
    res.json(toContextResponse(campaignConfig));
  }

  return { getSummary, getTrend, getCoverage, getContext };
}
