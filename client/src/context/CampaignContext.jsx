/**
 * Loads campaign identity and filter options once for the shell and every view.
 */

import { useMemo } from 'react';
import { fetchCampaignContext } from '../api/campaignAnalyticsClient.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import { CampaignContext } from './campaignContext.js';

const NO_PARAMS = Object.freeze({});

export function CampaignProvider({ children }) {
  const { status, response, error, reload } = useAnalyticsRequest(fetchCampaignContext, NO_PARAMS, {
    endpoint: '/api/analytics/context',
    debounceMs: 0,
  });

  const value = useMemo(
    () => ({
      context: response?.context ?? null,
      lgas: response?.context?.lgas ?? [],
      activityTypes: response?.context?.activity_types ?? [],
      status,
      error,
      reload,
    }),
    [response, status, error, reload],
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}
