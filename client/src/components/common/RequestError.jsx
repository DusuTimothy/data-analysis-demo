/**
 * Standard error alert with optional retry for a single data request.
 */

import StatusAlert from '../analytics/StatusAlert.jsx';

export default function RequestError({ error, onRetry, title = 'Could not load this view' }) {
  return (
    <StatusAlert tone="error" title={`${title} (${error.code})`}>
      <p>{error.message}</p>
      {error.requestId ? (
        <p className="mt-1 font-mono text-xs">Request ID: {error.requestId}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/40"
        >
          Retry
        </button>
      ) : null}
    </StatusAlert>
  );
}
