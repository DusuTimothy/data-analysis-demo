/**
 * Accessible inline status or error message. Content is rendered as text only.
 */

const TONE_STYLES = {
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

export default function StatusAlert({ tone = 'info', title, children }) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`rounded-lg border px-4 py-3 ${TONE_STYLES[tone] ?? TONE_STYLES.info}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
    </div>
  );
}
