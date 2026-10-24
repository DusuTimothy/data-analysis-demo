/**
 * Skeleton for the four headline metric cards.
 */

export default function LoadingCards() {
  return (
    <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
      <span className="sr-only">Loading campaign activity…</span>
    </div>
  );
}
