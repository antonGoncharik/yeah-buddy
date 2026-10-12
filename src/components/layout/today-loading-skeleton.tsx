export function TodayLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загрузка дня"
      className="flex w-full flex-col gap-3 pb-2"
      aria-busy="true"
    >
      <div className="card-surface flex flex-col gap-3 p-4">
        <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-muted/80" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-muted/80" />
        <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-muted/80" />
      </div>
      <div className="card-surface flex flex-col gap-2 p-4">
        <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/70" />
      </div>
      <div className="card-surface flex flex-col gap-2 p-4">
        <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-14 animate-pulse rounded-xl bg-muted/70" />
      </div>
      <p className="sr-only">Загрузка…</p>
    </div>
  );
}
