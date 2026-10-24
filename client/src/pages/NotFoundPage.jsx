/**
 * Fallback for unknown client routes.
 */

import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader.jsx';

export default function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="View not found" description="That campaign view does not exist." />
      <Link
        to="/overview"
        className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to overview
      </Link>
    </div>
  );
}
