/**
 * Consistent framed container for a chart, its title, and optional controls.
 */

export function ChartSkeleton() {
  return <div aria-hidden="true" className="h-72 animate-pulse rounded-lg bg-slate-100" />;
}

export function ChartEmpty({ message = 'No data for the current filters.' }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function ChartCard({ title, description, actions, children }) {
  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <figcaption className="text-sm font-semibold text-slate-900">{title}</figcaption>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </figure>
  );
}
