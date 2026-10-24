/**
 * Stores shared campaign filters in the URL so navigating between views
 * preserves the current LGA, activity type, ward, and date range.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const FILTER_PARAM_KEYS = ['lga', 'activity_type', 'ward', 'from', 'to'];

const FILTER_PARAM_BY_NAME = {
  lga: 'lga',
  activityType: 'activity_type',
  ward: 'ward',
  from: 'from',
  to: 'to',
};

export function useAnalyticsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      lga: searchParams.get('lga') ?? '',
      activityType: searchParams.get('activity_type') ?? '',
      ward: searchParams.get('ward') ?? '',
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
    }),
    [searchParams],
  );

  const setParam = useCallback(
    (key, value) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === undefined || value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilter = useCallback(
    (name, value) => {
      const key = FILTER_PARAM_BY_NAME[name];
      if (key) {
        setParam(key, typeof value === 'string' ? value.trim() : '');
      }
    },
    [setParam],
  );

  const reset = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const key of FILTER_PARAM_KEYS) {
          next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const getParam = useCallback(
    (key, fallback = '') => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const queryParams = useMemo(
    () => ({
      lga: filters.lga || undefined,
      activity_type: filters.activityType || undefined,
      ward: filters.ward || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [filters],
  );

  return { filters, queryParams, setFilter, setParam, getParam, reset };
}
