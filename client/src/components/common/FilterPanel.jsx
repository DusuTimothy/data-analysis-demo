/**
 * Shared filter card. Filter values live in the URL, not local page state.
 */

import { useCampaign } from '../../hooks/useCampaign.js';
import FilterBar from '../analytics/FilterBar.jsx';

export default function FilterPanel({ filters, onChange, onReset }) {
  const { lgas, activityTypes } = useCampaign();

  return (
    <section
      aria-labelledby="filters-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="filters-heading" className="text-sm font-semibold text-slate-900">
          Filters
        </h2>
        <p className="text-xs text-slate-500">Filters are shared across every view.</p>
      </div>
      <div className="mt-4">
        <FilterBar
          filters={filters}
          options={{ lgas, activity_types: activityTypes }}
          onChange={onChange}
          onReset={onReset}
        />
      </div>
    </section>
  );
}
