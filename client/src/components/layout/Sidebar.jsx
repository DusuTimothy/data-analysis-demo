/**
 * Primary navigation. Views are real routes and the current filter query string
 * is preserved when switching between them.
 */

import { NavLink, useLocation } from 'react-router-dom';

const SECTIONS = [
  {
    label: 'Campaign',
    items: [
      { to: '/overview', label: 'Overview' },
      { to: '/trends', label: 'Trends' },
      { to: '/coverage', label: 'Coverage' },
    ],
  },
  {
    label: 'Breakdowns',
    items: [
      { to: '/lgas', label: 'LGAs' },
      { to: '/wards', label: 'Wards' },
      { to: '/polling-units', label: 'Polling units' },
      { to: '/activity-types', label: 'Activity types' },
    ],
  },
  {
    label: 'Data',
    items: [{ to: '/table', label: 'Data table' }],
  },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="campaign-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } lg:visible lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Plateau 2027
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight">Campaign Analytics</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10 lg:hidden"
          >
            Close
          </button>
        </div>

        <nav aria-label="Campaign views" className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.label}
              </p>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={{ pathname: item.to, search: location.search }}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block rounded-md border-l-2 px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-emerald-400 bg-emerald-500/15 text-white'
                            : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs leading-5 text-slate-400">
          Aggregate reporting only. No voter names, phone numbers, or other personal data.
        </div>
      </aside>
    </>
  );
}
