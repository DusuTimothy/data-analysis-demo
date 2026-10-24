/**
 * Full data table with a grouping selector stored in the URL.
 */

import { useMemo } from 'react';
import { fetchCampaignSummary } from '../api/campaignAnalyticsClient.js';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters.js';
import { useAnalyticsRequest } from '../hooks/useAnalyticsRequest.js';
import { GROUP_BY_VALUES, GROUP_OPTIONS } from '../constants/analytics.js';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterPanel from '../components/common/FilterPanel.jsx';
import RequestError from '../components/common/RequestError.jsx';
import LoadingCards from '../components/common/LoadingCards.jsx';
import SummaryCards from '../components/analytics/SummaryCards.jsx';
import CampaignTable from '../components/analytics/CampaignTable.jsx';
import StatusAlert from '../components/analytics/StatusAlert.jsx';

export default function TablePage() {
  const { filters, queryParams, setFilter, reset, getParam, setParam } = useAnalyticsFilters();
  const requestedGroupBy = getParam('group_by', 'lga');
  const groupBy = GROUP_BY_VALUES.includes(requestedGroupBy) ? requestedGroupBy : 'lga';

  const params = useMemo(
    () => ({ group_by: groupBy, ...queryParams }),
    [groupBy, queryParams],
  );

  const result = useAnalyticsRequest(fetchCampaignSummary, params, {
    endpoint: '/api/analytics/summary',
  });

  const rows = result.response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data table"
        description="The complete aggregation behind every chart, with a totals row."
      />

      <FilterPanel filters={filters} onChange={setFilter} onReset={reset} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="table-grouping"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          Group rows by
        </label>
        <select
          id="table-grouping"
          value={groupBy}
          onChange={(event) => setParam('group_by', event.target.value)}
          className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        >
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {result.error ? <RequestError error={result.error} onRetry={result.reload} /> : null}

      {result.status === 'loading' && !result.response ? <LoadingCards /> : null}
      {result.response ? <SummaryCards totals={result.response.totals} /> : null}

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
