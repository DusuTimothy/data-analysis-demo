/**
 * Single-metric time series. Contacts and spend are rendered as separate charts
 * to avoid a misleading dual-axis comparison.
 */

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatPeriodLabel } from '../../utils/formatLabel.js';
import { formatCompactCurrency, formatCompactNumber } from '../../utils/formatNumber.js';
import { ChartEmpty } from '../common/ChartCard.jsx';

const METRICS = {
  contacts: {
    label: 'Contacts',
    accessor: (row) => row.total_contacts,
    axis: formatCompactNumber,
    tooltip: formatCompactNumber,
    color: '#0f766e',
  },
  spend: {
    label: 'Spend',
    accessor: (row) => row.total_spend,
    axis: formatCompactCurrency,
    tooltip: formatCurrency,
    color: '#b45309',
  },
};

export default function TrendChart({ rows, bucket = 'month', metric = 'contacts' }) {
  const metricConfig = METRICS[metric] ?? METRICS.contacts;
  const [containerRef, width] = useElementWidth();

  if (!rows || rows.length === 0) {
    return <ChartEmpty message="No activity matches the current filters." />;
  }

  const data = rows.map((row) => ({
    label: formatPeriodLabel(row.period, bucket),
    value: Number(metricConfig.accessor(row)) || 0,
  }));

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${metricConfig.label} over time, grouped by ${bucket}`}
      className="h-72 w-full"
    >
      {width > 0 ? (
        <LineChart width={width} height={288} data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            minTickGap={24}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={metricConfig.axis}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            formatter={(value) => [metricConfig.tooltip(value), metricConfig.label]}
            contentStyle={{ borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }}
          />
          <Line
            type="linear"
            dataKey="value"
            name={metricConfig.label}
            stroke={metricConfig.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      ) : null}
    </div>
  );
}
