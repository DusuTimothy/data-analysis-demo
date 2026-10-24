/**
 * Reusable ranked breakdown page for LGA, ward, polling unit, and activity type.
 * The chart shows the top groups; the table always shows every group.
 */

import { useMemo, useState } from 'react';
import { fetchCampaignSummary } from '../api/campaignAnalyticsClient.js';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import { GROUP_LABELS } from '../constants/analytics.js';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterPanel from '../components/common/FilterPanel.jsx';
import RequestError from '../components/common/RequestError.jsx';
import LoadingCards from '../components/common/LoadingCards.jsx';
import ChartCard, { ChartEmpty, ChartSkeleton } from '../components/common/ChartCard.jsx';
import SummaryCards from '../components/analytics/SummaryCards.jsx';
import CampaignTable from '../components/analytics/CampaignTable.jsx';
import HorizontalBarChart from '../components/analytics/HorizontalBarChart.jsx';
import MetricToggle from '../components/analytics/MetricToggle.jsx';
import StatusAlert from '../components/analytics/StatusAlert.jsx';

export default function RankedViewPage({
  groupBy,
  title,
  description,
  defaultMetric = 'contacts',
  maxItems = 12,
}) {
  const { filters, queryParams, setFilter, reset } = useAnalyticsFilters();
  const [metric, setMetric] = useState(defaultMetric);

  const params = useMemo(
    () => ({ group_by: groupBy, ...queryParams }),
    [groupBy, queryParams],
  );

  const result = useAnalyticsRequest(fetchCampaignSummary, params, {
    endpoint: `/api/analytics/summary?group_by=${groupBy}`,
  });

  const rows = result.response?.data ?? [];
  const groupLabel = GROUP_LABELS[groupBy] ?? 'Group';
  const shownCount = Math.min(maxItems, rows.length || maxItems);

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <FilterPanel filters={filters} onChange={setFilter} onReset={reset} />

      {result.error ? <RequestError error={result.error} onRetry={result.reload} /> : null}

      {result.status === 'loading' && !result.response ? <LoadingCards /> : null}
      {result.response ? <SummaryCards totals={result.response.totals} /> : null}

      <ChartCard
        title={`${groupLabel} comparison`}
        description={`Top ${shownCount} ${groupLabel} ${shownCount === 1 ? 'group' : 'groups'} for the selected measure. The table below lists every group.`}
        actions={<MetricToggle value={metric} onChange={setMetric} />}
      >
        {result.error && !result.response ? (
          <ChartEmpty message={`${groupLabel} comparison is unavailable. Use Retry above.`} />
        ) : result.status === 'loading' && !result.response ? (
          <ChartSkeleton />
        ) : (
          <HorizontalBarChart
            rows={rows}
            groupBy={groupBy}
            metric={metric}
            maxItems={maxItems}
          />
        )}
      </ChartCard>

      {rows.length > 0 ? (
        <CampaignTable rows={rows} totals={result.response.totals} groupBy={groupBy} />
      ) : result.response ? (
        <StatusAlert tone="warning" title="No activities matched these filters">
          Widen the date range or clear the LGA, ward, and activity type filters.
        </StatusAlert>
      ) : null}
    </div>
  );
}
