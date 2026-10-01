import { cn } from "@/lib/utils";

export function StatGrid({
  items,
  size = "md",
}: {
  items: Array<{
    label: string;
    value: string;
    detail?: string | null;
    quiet?: boolean;
  }>;
  size?: "md" | "lg";
}) {
  const shown = items.filter((item) => item.value !== "");
  if (shown.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-2">
      {shown.map((item, index) => (
        <div
          key={`${item.label}:${item.value}`}
          className={cn(
            "rounded-2xl bg-muted/50 px-3.5 py-3",
            shown.length % 2 === 1 &&
              index === shown.length - 1 &&
              "col-span-2",
          )}
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              "mt-1 font-semibold tracking-tight tabular-nums",
              size === "lg" ? "text-2xl" : "text-xl",
              item.quiet && "text-lg font-medium text-muted-foreground",
            )}
          >
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
