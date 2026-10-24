/**
 * Coverage matrix: which activity types have reached which LGAs. Gaps are the
 * point of this view, so every configured LGA and activity type is shown.
 */

import { useMemo, useState } from 'react';
import { fetchCampaignCoverage } from '../api/campaignAnalyticsClient.js';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import { useCampaign } from '../hooks/useCampaign.js';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterPanel from '../components/common/FilterPanel.jsx';
import RequestError from '../components/common/RequestError.jsx';
import LoadingCards from '../components/common/LoadingCards.jsx';
import ChartCard, { ChartSkeleton } from '../components/common/ChartCard.jsx';
import SummaryCards from '../components/analytics/SummaryCards.jsx';
import CoverageHeatmap from '../components/analytics/CoverageHeatmap.jsx';
import MetricToggle from '../components/analytics/MetricToggle.jsx';
import StatusAlert from '../components/analytics/StatusAlert.jsx';

const HEATMAP_METRICS = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'spend', label: 'Spend' },
];

export default function CoveragePage() {
  const { filters, queryParams, setFilter, reset } = useAnalyticsFilters();
  const { lgas: contextLgas, activityTypes: contextActivityTypes } = useCampaign();
  const [metric, setMetric] = useState('contacts');

  const params = useMemo(() => ({ ...queryParams }), [queryParams]);

  const result = useAnalyticsRequest(fetchCampaignCoverage, params, {
    endpoint: '/api/analytics/coverage',
  });

  const rows = result.response?.data ?? [];
  const allLgas = contextLgas.length > 0 ? contextLgas : [...new Set(rows.map((row) => row.lga))];
  const allActivityTypes =
    contextActivityTypes.length > 0
      ? contextActivityTypes
      : [...new Set(rows.map((row) => row.activity_type))];
  const lgas = filters.lga ? allLgas.filter((lga) => lga === filters.lga) : allLgas;
  const activityTypes = filters.activityType
    ? allActivityTypes.filter((activityType) => activityType === filters.activityType)
    : allActivityTypes;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coverage"
        description="Where each activity type has reached across the district. Empty cells are gaps worth discussing with the field team."
      />

      <FilterPanel filters={filters} onChange={setFilter} onReset={reset} />

      {result.error ? <RequestError error={result.error} onRetry={result.reload} /> : null}

      {result.status === 'loading' && !result.response ? <LoadingCards /> : null}
      {result.response ? <SummaryCards totals={result.response.totals} /> : null}

      <ChartCard
        title="LGA by activity type"
        description="Colour intensity reflects the selected measure. Every LGA and activity type matching the dimension filters is shown."
        actions={<MetricToggle value={metric} onChange={setMetric} options={HEATMAP_METRICS} />}
      >
        {result.status === 'loading' && !result.response ? (
          <ChartSkeleton />
        ) : (
          <div className="space-y-4">
            {result.response && rows.length === 0 ? (
              <StatusAlert tone="warning" title="No activity matches these filters">
                The matrix still shows the configured coverage gaps for this view. Widen the date
                range or clear the ward and activity type filters to see recorded activity.
              </StatusAlert>
            ) : null}
            <CoverageHeatmap
              rows={rows}
              lgas={lgas}
              activityTypes={activityTypes}
              metric={metric}
            />
          </div>
        )}
      </ChartCard>
    </div>
  );
}
