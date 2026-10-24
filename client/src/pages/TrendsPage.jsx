/**
 * Time-series view. Weekly and monthly buckets are shareable through the URL.
 * Contacts and spend use separate charts rather than a dual axis.
 */

import { useMemo } from 'react';
import { fetchCampaignTrends } from '../api/campaignAnalyticsClient.js';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import { TREND_BUCKETS } from '../constants/analytics.js';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterPanel from '../components/common/FilterPanel.jsx';
import RequestError from '../components/common/RequestError.jsx';
import LoadingCards from '../components/common/LoadingCards.jsx';
import ChartCard, { ChartSkeleton, ChartEmpty } from '../components/common/ChartCard.jsx';
import SummaryCards from '../components/analytics/SummaryCards.jsx';
import TrendChart from '../components/analytics/TrendChart.jsx';
import MetricToggle from '../components/analytics/MetricToggle.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatInteger } from '../utils/formatInteger.js';
import { formatPeriodLabel } from '../utils/formatLabel.js';
import { fillTrendPeriods } from '../utils/trend.js';

const BUCKET_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

export default function TrendsPage() {
  const { filters, queryParams, setFilter, reset, getParam, setParam } = useAnalyticsFilters();
  const requestedBucket = getParam('bucket', 'month');
  const bucket = TREND_BUCKETS.includes(requestedBucket) ? requestedBucket : 'month';

  const params = useMemo(
    () => ({ bucket, ...queryParams }),
    [bucket, queryParams],
  );

  const result = useAnalyticsRequest(fetchCampaignTrends, params, {
    endpoint: '/api/analytics/trends',
  });

  const rows = useMemo(
    () => fillTrendPeriods(result.response?.data ?? [], bucket),
    [result.response, bucket],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trends"
        description="Contacts and spend over time. Choose weekly or monthly buckets; periods without recorded activity are shown as zero."
        actions={
          <MetricToggle
            value={bucket}
            onChange={(value) => setParam('bucket', value)}
            options={BUCKET_OPTIONS}
            ariaLabel="Time bucket"
          />
        }
      />

      <FilterPanel filters={filters} onChange={setFilter} onReset={reset} />

      {result.error ? <RequestError error={result.error} onRetry={result.reload} /> : null}

      {result.status === 'loading' && !result.response ? <LoadingCards /> : null}
      {result.response ? <SummaryCards totals={result.response.totals} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Contacts over time"
          description="People reached in each period."
        >
          {result.status === 'loading' && !result.response ? (
            <ChartSkeleton />
          ) : (
            <TrendChart rows={rows} bucket={bucket} metric="contacts" />
          )}
        </ChartCard>

        <ChartCard title="Spend over time" description="NGN spent in each period.">
          {result.status === 'loading' && !result.response ? (
            <ChartSkeleton />
          ) : (
            <TrendChart rows={rows} bucket={bucket} metric="spend" />
          )}
        </ChartCard>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Campaign totals by period</caption>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
                  Period
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">
                  Activities
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">
                  Contacts
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">
                  Spend
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-700">
                  Cost per contact
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.period}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-slate-900">
                    {formatPeriodLabel(row.period, bucket)}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatInteger(row.total_activities)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatInteger(row.total_contacts)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatCurrency(row.total_spend)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatCurrency(row.cost_per_contact)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <th scope="row" className="px-4 py-3 text-left font-semibold text-slate-900">
                  All filtered activities
                </th>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatInteger(result.response.totals.total_activities)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatInteger(result.response.totals.total_contacts)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(result.response.totals.total_spend)}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(result.response.totals.cost_per_contact)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : result.response ? (
        <ChartEmpty message="No activity matches the current filters." />
      ) : null}
    </div>
  );
}
