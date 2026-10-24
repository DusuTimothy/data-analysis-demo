/**
 * Validates and normalizes the analytics query string before any controller
 * or database code runs. Rejects arrays, objects, unknown keys, and malformed
 * dates instead of coercing them.
 */

import { AppError } from '../errors/AppError.js';
import { ACTIVITY_TYPES, GROUP_BY_VALUES, TREND_BUCKETS } from '../config/campaign.js';

const BASE_ALLOWED_KEYS = ['group_by', 'lga', 'ward', 'activity_type', 'from', 'to'];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readString(req, key) {
  const value = req.query[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw AppError.badRequest(`${key} must be provided once as a string.`);
  }
  return value.trim();
}

function isRealIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateAnalyticsQuery(campaignConfig, { allowBucket = false } = {}) {
  const lgas = new Set(campaignConfig.lgas);
  const allowedKeys = new Set(allowBucket ? [...BASE_ALLOWED_KEYS, 'bucket'] : BASE_ALLOWED_KEYS);

  return function validateQuery(req, _res, next) {
    try {
      const unknownKeys = Object.keys(req.query).filter((key) => !allowedKeys.has(key));
      if (unknownKeys.length > 0) {
        throw AppError.badRequest(`Unknown query parameter(s): ${unknownKeys.join(', ')}.`);
      }

      const rawGroupBy = readString(req, 'group_by');
      const groupBy = rawGroupBy === undefined ? 'lga' : rawGroupBy;
      if (!GROUP_BY_VALUES.includes(groupBy)) {
        throw AppError.badRequest(`group_by must be one of: ${GROUP_BY_VALUES.join(', ')}.`);
      }

      const rawLga = readString(req, 'lga');
      const lga = rawLga ? rawLga : undefined;
      if (lga !== undefined && !lgas.has(lga)) {
        throw AppError.badRequest('lga must be one of the configured senatorial district LGAs.');
      }

      const rawWard = readString(req, 'ward');
      const ward = rawWard ? rawWard : undefined;
      if (ward !== undefined && ward.length > 100) {
        throw AppError.badRequest('ward must be 100 characters or fewer.');
      }

      const rawActivityType = readString(req, 'activity_type');
      const activityType = rawActivityType ? rawActivityType : undefined;
      if (activityType !== undefined && !ACTIVITY_TYPES.includes(activityType)) {
        throw AppError.badRequest(
          `activity_type must be one of: ${ACTIVITY_TYPES.join(', ')}.`,
        );
      }

      const rawFrom = readString(req, 'from');
      const from = rawFrom ? rawFrom : undefined;
      if (from !== undefined && !isRealIsoDate(from)) {
        throw AppError.badRequest('from must be a valid date in YYYY-MM-DD format.');
      }

      const rawTo = readString(req, 'to');
      const to = rawTo ? rawTo : undefined;
      if (to !== undefined && !isRealIsoDate(to)) {
        throw AppError.badRequest('to must be a valid date in YYYY-MM-DD format.');
      }

      if (from !== undefined && to !== undefined && from > to) {
        throw AppError.badRequest('from must be earlier than or equal to to.');
      }

      const validatedQuery = { groupBy, lga, ward, activityType, from, to };

      if (allowBucket) {
        const rawBucket = readString(req, 'bucket');
        const bucket = rawBucket === undefined ? 'month' : rawBucket;
        if (!TREND_BUCKETS.includes(bucket)) {
          throw AppError.badRequest(`bucket must be one of: ${TREND_BUCKETS.join(', ')}.`);
        }
        validatedQuery.bucket = bucket;
      }

      req.validatedQuery = validatedQuery;
      next();
    } catch (error) {
      next(error);
    }
  };
}
