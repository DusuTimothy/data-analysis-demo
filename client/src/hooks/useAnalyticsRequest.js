/**
 * Shared request lifecycle: debounce, abort, normalized errors, and a retry
 * trigger. Pages only decide how to render the returned status.
 */

import { useCallback, useEffect, useState } from 'react';

export function useAnalyticsRequest(
  requestFn,
  params,
  { endpoint = 'analytics request', debounceMs = 250 } = {},
) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({ status: 'loading', response: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    const debounceTimer = setTimeout(() => {
      setState((previous) => ({ ...previous, status: 'loading', error: null }));

      requestFn({ params, signal: controller.signal })
        .then((response) => {
          if (controller.signal.aborted) {
            return;
          }
          setState({ status: 'success', response, error: null });
        })
        .catch((error) => {
          if (controller.signal.aborted || error?.name === 'AbortError') {
            return;
          }
          console.error('Analytics request failed', {
            endpoint,
            code: error?.code,
            status: error?.status ?? null,
            requestId: error?.requestId ?? null,
          });
          setState((previous) => ({
            status: 'error',
            response: previous.response,
            error: {
              code: error?.code ?? 'UNKNOWN_ERROR',
              message: error?.message ?? 'The analytics request failed.',
              requestId: error?.requestId ?? null,
            },
          }));
        });
    }, debounceMs);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [requestFn, params, debounceMs, endpoint, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { ...state, reload };
}
