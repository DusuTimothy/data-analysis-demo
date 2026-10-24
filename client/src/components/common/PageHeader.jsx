/**
 * Consistent page title with the campaign identity from the shared context.
 */

import { useCampaign } from '../../hooks/useCampaign.js';

export default function PageHeader({ title, description, actions }) {
  const { context } = useCampaign();

  return (
    <header className="border-b border-slate-200 pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
        {context?.candidate ? `${context.candidate} · ` : ''}
        {context?.party ?? 'APC'} · {context?.senatorial_district ?? 'Plateau'} ·{' '}
        {context?.election_year ?? 2027}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
    </header>
  );
}
