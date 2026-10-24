/**
 * Controlled filter controls for the fields shared by every view. Options come
 * from the API context so the client never invents LGAs or activity types.
 */

import { formatActivityType } from '../../utils/formatLabel.js';

const FIELD_CLASS =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:bg-slate-100';

const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wide text-slate-600';

export default function FilterBar({ filters, options, onChange, onReset }) {
  const lgas = options?.lgas ?? [];
  const activityTypes = options?.activity_types ?? [];

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <div>
        <label className={LABEL_CLASS} htmlFor="lga-filter">
          LGA
        </label>
        <select
          id="lga-filter"
          className={FIELD_CLASS}
          value={filters.lga}
          disabled={lgas.length === 0}
          onChange={(event) => onChange('lga', event.target.value)}
        >
          <option value="">All LGAs</option>
          {lgas.map((lga) => (
            <option key={lga} value={lga}>
              {lga}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="activity-filter">
          Activity type
        </label>
        <select
          id="activity-filter"
          className={FIELD_CLASS}
          value={filters.activityType}
          disabled={activityTypes.length === 0}
          onChange={(event) => onChange('activityType', event.target.value)}
        >
          <option value="">All activity types</option>
          {activityTypes.map((activityType) => (
            <option key={activityType} value={activityType}>
              {formatActivityType(activityType)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="ward-filter">
          Ward (optional)
        </label>
        <input
          id="ward-filter"
          type="text"
          className={FIELD_CLASS}
          value={filters.ward}
          maxLength={100}
          placeholder="e.g. Ward A"
          onChange={(event) => onChange('ward', event.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="from-filter">
          From
        </label>
        <input
          id="from-filter"
          type="date"
          className={FIELD_CLASS}
          value={filters.from}
          onChange={(event) => onChange('from', event.target.value)}
        />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="to-filter">
          To
        </label>
        <input
          id="to-filter"
          type="date"
          className={FIELD_CLASS}
          value={filters.to}
          onChange={(event) => onChange('to', event.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        >
          Reset filters
        </button>
      </div>
    </form>
  );
}
