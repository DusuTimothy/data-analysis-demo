/**
 * Ranked horizontal bar chart. The table beneath each page remains the
 * accessible, precise source of the same numbers.
 */

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { GROUP_LABELS } from '../../constants/analytics.js';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatGroupValue } from '../../utils/formatLabel.js';
import { formatCompactCurrency, formatCompactNumber } from '../../utils/formatNumber.js';
import { ChartEmpty } from '../common/ChartCard.jsx';

const METRICS = {
  contacts: {
    label: 'Contacts',
    accessor: (row) => row.total_contacts,
    axis: formatCompactNumber,
    tooltip: (value) => formatCompactNumber(value),
  },
  spend: {
    label: 'Spend',
    accessor: (row) => row.total_spend,
    axis: formatCompactCurrency,
    tooltip: formatCurrency,
  },
  cost: {
    label: 'Cost per contact',
    accessor: (row) => row.cost_per_contact,
    axis: formatCompactCurrency,
    tooltip: formatCurrency,
  },
};

export default function HorizontalBarChart({
  rows,
  groupBy,
  metric = 'contacts',
  maxItems = 12,
}) {
  const metricConfig = METRICS[metric] ?? METRICS.contacts;
  const [containerRef, width] = useElementWidth();

  const data = useMemo(() => {
    return [...rows]
      .filter((row) => {
        if (metric === 'cost') {
          return row.cost_per_contact !== null && row.cost_per_contact !== undefined;
        }
        return true;
      })
      .map((row) => ({
        label: formatGroupValue(row.group, groupBy),
        value: Number(metricConfig.accessor(row)) || 0,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, maxItems);
  }, [rows, groupBy, metric, metricConfig, maxItems]);

  if (data.length === 0) {
    return (
      <ChartEmpty
        message={
          metric === 'cost'
            ? 'No group in this filter has both contacts and spend, so cost per contact is unavailable.'
            : 'No activity matches the current filters.'
        }
      />
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${metricConfig.label} by ${GROUP_LABELS[groupBy] ?? 'group'}`}
      className="h-80 w-full"
    >
      {width > 0 ? (
        <BarChart
          width={width}
          height={320}
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            tickFormatter={metricConfig.axis}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={120}
            tick={{ fontSize: 11, fill: '#334155' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [metricConfig.tooltip(value), metricConfig.label]}
            contentStyle={{ borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }}
          />
          <Bar
            dataKey="value"
            name={metricConfig.label}
            fill="#0f766e"
            radius={[0, 4, 4, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
        </BarChart>
      ) : null}
    </div>
  );
}
