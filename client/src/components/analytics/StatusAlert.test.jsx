import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StatusAlert from './StatusAlert.jsx';

describe('StatusAlert', () => {
  it('announces errors assertively', () => {
    const markup = renderToStaticMarkup(
      <StatusAlert tone="error" title="Could not load analytics">
        <p>Request ID: abc-123</p>
      </StatusAlert>,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain('Could not load analytics');
    expect(markup).toContain('Request ID: abc-123');
  });

  it('renders informational messages politely', () => {
    const markup = renderToStaticMarkup(<StatusAlert tone="info" title="Refreshing…" />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
  });
});
