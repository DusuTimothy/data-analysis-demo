/**
 * Route table. Every view is a real URL so filters and views can be shared,
 * bookmarked, and reloaded without losing the current query string.
 */

import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';

const OverviewPage = lazy(() => import('./pages/OverviewPage.jsx'));
const TrendsPage = lazy(() => import('./pages/TrendsPage.jsx'));
const CoveragePage = lazy(() => import('./pages/CoveragePage.jsx'));
const RankedViewPage = lazy(() => import('./pages/RankedViewPage.jsx'));
const TablePage = lazy(() => import('./pages/TablePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="coverage" element={<CoveragePage />} />
        <Route
          path="lgas"
          element={
            <RankedViewPage
              groupBy="lga"
              title="LGAs"
              description="Compare local government areas by contacts, spend, and cost per contact."
            />
          }
        />
        <Route
          path="wards"
          element={
            <RankedViewPage
              groupBy="ward"
              title="Wards"
              description="Ward-level results. Groups without a recorded ward are shown as (not recorded)."
            />
          }
        />
        <Route
          path="polling-units"
          element={
            <RankedViewPage
              groupBy="polling_unit"
              title="Polling units"
              description="Polling-unit coverage where field teams recorded it. Use this to spot unvisited units."
            />
          }
        />
        <Route
          path="activity-types"
          element={
            <RankedViewPage
              groupBy="activity_type"
              title="Activity types"
              description="Which kinds of campaign activity are producing contacts and consuming budget."
            />
          }
        />
        <Route path="table" element={<TablePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
