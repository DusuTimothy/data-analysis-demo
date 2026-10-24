/**
 * Responsive aggregation table with a totals row.
 */

import { GROUP_LABELS } from '../../constants/analytics.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatInteger } from '../../utils/formatInteger.js';
import { formatGroupValue } from '../../utils/formatLabel.js';

export default function CampaignTable({ rows, totals, groupBy }) {
  const groupLabel = GROUP_LABELS[groupBy] ?? 'Group';

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">
          Campaign activity aggregates grouped by {groupLabel.toLowerCase()}
        </caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
              {groupLabel}
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
            <tr key={row.group} className="hover:bg-slate-50/70">
              <th scope="row" className="px-4 py-3 text-left font-medium text-slate-900">
                {formatGroupValue(row.group, groupBy)}
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
              {formatInteger(totals.total_activities)}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
              {formatInteger(totals.total_contacts)}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
              {formatCurrency(totals.total_spend)}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
              {formatCurrency(totals.cost_per_contact)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
