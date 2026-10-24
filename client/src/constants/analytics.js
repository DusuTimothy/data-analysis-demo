/**
 * Client-side presentation constants. Values must match the server allowlists.
 */

export const GROUP_OPTIONS = Object.freeze([
  { value: 'lga', label: 'LGA' },
  { value: 'ward', label: 'Ward' },
  { value: 'polling_unit', label: 'Polling unit' },
  { value: 'activity_type', label: 'Activity type' },
]);

export const GROUP_BY_VALUES = Object.freeze(GROUP_OPTIONS.map((option) => option.value));

export const GROUP_LABELS = Object.freeze({
  lga: 'LGA',
  ward: 'Ward',
  polling_unit: 'Polling unit',
  activity_type: 'Activity type',
});

export const TREND_BUCKETS = Object.freeze(['week', 'month']);
