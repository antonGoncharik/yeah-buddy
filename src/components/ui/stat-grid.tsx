export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; detail?: string | null }>;
}) {
  const shown = items.filter((item) => item.value !== "");
  if (shown.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-2">
      {shown.map((item) => (
        <div
          key={`${item.label}:${item.value}`}
          className="rounded-2xl bg-muted/50 px-3 py-3"
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-lg font-semibold tracking-tight tabular-nums">
            {item.value}
          </dd>
          {item.detail ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
