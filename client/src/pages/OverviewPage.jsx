/**
 * Executive overview: headline totals, LGA comparison, activity mix, and a
 * monthly contact trend for the shared filter set.
 */

import { useMemo } from 'react';
import {
  fetchCampaignSummary,
  fetchCampaignTrends,
} from '../api/campaignAnalyticsClient.js';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterPanel from '../components/common/FilterPanel.jsx';
import RequestError from '../components/common/RequestError.jsx';
import LoadingCards from '../components/common/LoadingCards.jsx';
import ChartCard, { ChartEmpty, ChartSkeleton } from '../components/common/ChartCard.jsx';
import SummaryCards from '../components/analytics/SummaryCards.jsx';
import HorizontalBarChart from '../components/analytics/HorizontalBarChart.jsx';
import TrendChart from '../components/analytics/TrendChart.jsx';
import { fillTrendPeriods } from '../utils/trend.js';

export default function OverviewPage() {
  const { filters, queryParams, setFilter, reset } = useAnalyticsFilters();

  const lgaParams = useMemo(() => ({ group_by: 'lga', ...queryParams }), [queryParams]);
  const activityParams = useMemo(
    () => ({ group_by: 'activity_type', ...queryParams }),
    [queryParams],
  );
  const trendParams = useMemo(() => ({ bucket: 'month', ...queryParams }), [queryParams]);

  const lgaResult = useAnalyticsRequest(fetchCampaignSummary, lgaParams, {
    endpoint: '/api/analytics/summary?group_by=lga',
  });
  const activityResult = useAnalyticsRequest(fetchCampaignSummary, activityParams, {
    endpoint: '/api/analytics/summary?group_by=activity_type',
  });
  const trendResult = useAnalyticsRequest(fetchCampaignTrends, trendParams, {
    endpoint: '/api/analytics/trends?bucket=month',
  });

  const trendRows = useMemo(
    () => fillTrendPeriods(trendResult.response?.data ?? [], 'month'),
    [trendResult.response],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign overview"
        description="Contacts reached, money spent, and field activity across the current filter set."
      />

      <FilterPanel filters={filters} onChange={setFilter} onReset={reset} />

      {lgaResult.error ? (
        <RequestError error={lgaResult.error} onRetry={lgaResult.reload} />
      ) : null}

      {lgaResult.status === 'loading' && !lgaResult.response ? <LoadingCards /> : null}
      {lgaResult.response ? <SummaryCards totals={lgaResult.response.totals} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Contacts by LGA"
          description="Ranked by contacts reached under the current filters."
        >
          {lgaResult.error && !lgaResult.response ? (
            <ChartEmpty message="Contacts by LGA are unavailable. Use Retry above." />
          ) : lgaResult.status === 'loading' && !lgaResult.response ? (
            <ChartSkeleton />
          ) : (
            <HorizontalBarChart
              rows={lgaResult.response?.data ?? []}
              groupBy="lga"
              metric="contacts"
              maxItems={12}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Spend by activity type"
          description="Where the campaign budget is going, ranked by NGN spend."
        >
          {activityResult.error ? (
            <RequestError
              error={activityResult.error}
              onRetry={activityResult.reload}
              title="Could not load activity mix"
            />
          ) : activityResult.status === 'loading' && !activityResult.response ? (
            <ChartSkeleton />
          ) : (
            <HorizontalBarChart
              rows={activityResult.response?.data ?? []}
              groupBy="activity_type"
              metric="spend"
              maxItems={7}
            />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Monthly contact trend"
        description="Contacts reached per month. Months without recorded activity are shown as zero. Use Trends for weekly detail and spend over time."
      >
        {trendResult.error ? (
          <RequestError
            error={trendResult.error}
            onRetry={trendResult.reload}
            title="Could not load the trend"
          />
        ) : trendResult.status === 'loading' && !trendResult.response ? (
          <ChartSkeleton />
        ) : (
          <TrendChart rows={trendRows} bucket="month" metric="contacts" />
        )}
      </ChartCard>
    </div>
  );
}
