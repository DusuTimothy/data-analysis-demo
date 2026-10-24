/**
 * Headline campaign totals for the current filter set.
 */

import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatInteger } from '../../utils/formatInteger.js';

export default function SummaryCards({ totals }) {
  const cards = [
    {
      label: 'Contacts reached',
      value: formatInteger(totals.total_contacts),
      detail: 'Across all recorded activities',
    },
    {
      label: 'Total spend',
      value: formatCurrency(totals.total_spend),
      detail: 'NGN, recorded campaign cost',
    },
    {
      label: 'Cost per contact',
      value: formatCurrency(totals.cost_per_contact),
      detail:
        totals.cost_per_contact === null
          ? 'No contacts recorded in this filter'
          : 'Average across the filtered activities',
    },
    {
      label: 'Activities',
      value: formatInteger(totals.total_activities),
      detail: 'Rallies, outreach, media, and more',
    },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {card.label}
          </dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {card.value}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">{card.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
