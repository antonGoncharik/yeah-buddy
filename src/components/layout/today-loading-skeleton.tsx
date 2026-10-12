export function TodayLoadingSkeleton() {
  return (
    <div
      role="status"
      className="flex w-full flex-col gap-3 px-4 pb-6 pt-2"
      aria-busy="true"
    >
      <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="card-surface h-24 animate-pulse rounded-2xl bg-muted/60" />
      <div className="card-surface h-36 animate-pulse rounded-2xl bg-muted/60" />
      <div className="card-surface h-36 animate-pulse rounded-2xl bg-muted/60" />
      <div className="card-surface h-28 animate-pulse rounded-2xl bg-muted/60" />
    </div>
  );
}
