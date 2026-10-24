/**
 * Responsive application frame: fixed sidebar on desktop, drawer on mobile,
 * shared regulatory banner, and the routed page content.
 */

import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useCampaign } from '../../hooks/useCampaign.js';
import StatusAlert from '../analytics/StatusAlert.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { error, reload } = useCampaign();

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-expanded={navOpen}
            aria-controls="campaign-sidebar"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Menu
          </button>
          <span className="text-sm font-semibold text-slate-900">Campaign Analytics</span>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div
            role="note"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span className="font-semibold">Synthetic data.</span> This dashboard uses demo records
            for testing, not real campaign records or polling unit results.
          </div>

          {error ? (
            <div className="mt-4">
              <StatusAlert tone="warning" title="Campaign configuration could not be loaded">
                <p>{error.message}</p>
                <button
                  type="button"
                  onClick={reload}
                  className="mt-2 rounded-md border border-amber-300 px-2 py-1 text-xs font-semibold hover:bg-amber-100"
                >
                  Retry
                </button>
              </StatusAlert>
            </div>
          ) : null}

          <div className="mt-6">
            <Suspense
              fallback={
                <p role="status" className="text-sm text-slate-500">
                  Loading view…
                </p>
              }
            >
              <Outlet />
            </Suspense>
          </div>

          <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p>
              Aggregates only. No voter names, phone numbers, or other personal data are stored or
              displayed. Run this tool behind SSO, a VPN, or reverse-proxy authentication.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
