/**
 * Campaign domain constants shared by the API, seed script, and tests.
 * The activity-type list is defined here once so validation cannot drift.
 */

export const ACTIVITY_TYPES = Object.freeze([
  'rally',
  'door_to_door',
  'town_hall',
  'market_outreach',
  'radio',
  'social_media',
  'billboard',
]);

export const ACTIVITY_TYPE_LABELS = Object.freeze({
  rally: 'Rally',
  door_to_door: 'Door-to-door',
  town_hall: 'Town hall',
  market_outreach: 'Market outreach',
  radio: 'Radio',
  social_media: 'Social media',
  billboard: 'Billboard',
});

export const GROUP_BY_VALUES = Object.freeze(['lga', 'ward', 'polling_unit', 'activity_type']);

export const TREND_BUCKETS = Object.freeze(['week', 'month']);

export const DIMENSION_COLUMNS = Object.freeze({
  lga: 'lga',
  ward: 'ward',
  polling_unit: 'polling_unit',
  activity_type: 'activity_type',
});

export const CURRENCY = 'NGN';
export const CURRENCY_LOCALE = 'en-NG';
export const TIME_ZONE = 'Africa/Lagos';

/**
 * Builds the immutable campaign configuration consumed by the API.
 * @param {ReturnType<import('./env.js').loadEnv>} env
 */
export function createCampaignConfig(env) {
  return Object.freeze({
    candidateName: env.candidateName,
    partyName: env.partyName,
    senatorialDistrict: env.senatorialDistrict,
    electionYear: env.electionYear,
    lgas: Object.freeze([...env.lgas]),
    activityTypes: ACTIVITY_TYPES,
    allowedOrigins: Object.freeze([...env.corsAllowedOrigins]),
    isProduction: env.isProduction,
    trustProxy: env.trustProxy,
  });
}
