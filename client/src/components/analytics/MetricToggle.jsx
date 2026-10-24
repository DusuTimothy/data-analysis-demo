/**
 * Accessible segmented control for choosing the chart measure.
 */

const DEFAULT_OPTIONS = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'spend', label: 'Spend' },
  { value: 'cost', label: 'Cost/contact' },
];

export default function MetricToggle({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  ariaLabel = 'Chart measure',
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border border-slate-300 bg-white p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
            value === option.value
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
