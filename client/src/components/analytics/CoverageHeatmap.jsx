/**
 * LGA x activity-type coverage matrix. Built as a real table so the heatmap is
 * readable by screen readers and remains precise without colour.
 */

import { useMemo } from 'react';
import { formatActivityType } from '../../utils/formatLabel.js';
import { formatInteger } from '../../utils/formatInteger.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatCompactCurrency } from '../../utils/formatNumber.js';
import { ChartEmpty } from '../common/ChartCard.jsx';

const METRICS = {
  contacts: {
    label: 'contacts',
    accessor: (row) => row.total_contacts,
    cell: formatInteger,
    full: formatInteger,
  },
  spend: {
    label: 'spend',
    accessor: (row) => row.total_spend,
    cell: formatCompactCurrency,
    full: formatCurrency,
  },
};

export default function CoverageHeatmap({ rows, lgas, activityTypes, metric = 'contacts' }) {
  const metricConfig = METRICS[metric] ?? METRICS.contacts;

  const lookup = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      map.set(`${row.lga}||${row.activity_type}`, row);
    }
    return map;
  }, [rows]);

  const maxValue = useMemo(() => {
    return rows.reduce(
      (maximum, row) => Math.max(maximum, Number(metricConfig.accessor(row)) || 0),
      0,
    );
  }, [rows, metricConfig]);

  if (lgas.length === 0 || activityTypes.length === 0) {
    return <ChartEmpty message="Campaign filter options are not available yet." />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <caption className="sr-only">
            {metricConfig.label} by LGA and activity type. Blank cells mean no recorded activity.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-slate-700"
              >
                LGA
              </th>
              {activityTypes.map((activityType) => (
                <th
                  key={activityType}
                  scope="col"
                  className="min-w-24 px-2 py-2 text-center font-semibold text-slate-600"
                >
                  {formatActivityType(activityType)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lgas.map((lga) => (
              <tr key={lga}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-medium text-slate-800"
                >
                  {lga}
                </th>
                {activityTypes.map((activityType) => {
                  const row = lookup.get(`${lga}||${activityType}`);
                  const value = row ? Number(metricConfig.accessor(row)) || 0 : null;
                  const ratio = value !== null && maxValue > 0 ? value / maxValue : 0;
                  const alpha = value === null ? 0 : 0.08 + ratio * 0.72;
                  const useLightText = ratio > 0.55;
                  const displayValue = row ? metricConfig.cell(value) : '—';

                  return (
                    <td
                      key={activityType}
                      title={
                        row
                          ? `${lga} · ${formatActivityType(activityType)}: ${metricConfig.full(value)}`
                          : `${lga} · ${formatActivityType(activityType)}: no recorded activity`
                      }
                      style={{ backgroundColor: `rgba(15, 118, 110, ${alpha})` }}
                      className={`rounded px-2 py-2 text-center tabular-nums ${
                        value === null
                          ? 'text-slate-400'
                          : useLightText
                            ? 'font-semibold text-white'
                            : 'font-medium text-emerald-950'
                      }`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>Blank cells mean no recorded activity. Hover a cell for the exact value.</p>
        <div className="flex items-center gap-2">
          <span>Low</span>
          <span className="flex overflow-hidden rounded">
            {[0.08, 0.24, 0.4, 0.56, 0.72].map((alpha) => (
              <span
                key={alpha}
                aria-hidden="true"
                className="h-3 w-6"
                style={{ backgroundColor: `rgba(15, 118, 110, ${alpha})` }}
              />
            ))}
          </span>
          <span>High ({maxValue > 0 ? metricConfig.cell(maxValue) : '—'})</span>
        </div>
      </div>
    </div>
  );
}
