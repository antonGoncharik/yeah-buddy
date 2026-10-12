import { cn } from "@/lib/utils";

export function MeterBar({
  ratio,
  barClass,
  overflow = false,
  size = "md",
  valueNow,
  valueMax = 100,
  valueText,
}: {
  ratio: number;
  barClass: string;
  overflow?: boolean;
  size?: "sm" | "md";
  valueNow?: number;
  valueMax?: number;
  valueText?: string;
}) {
  const pct = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  const showCap = size === "md" && pct > 2;
  const ariaNow =
    valueNow != null && Number.isFinite(valueNow) ? Math.round(valueNow) : pct;

  return (
    <div
      className={cn("relative", size === "sm" ? "h-2" : "h-2.5")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={valueMax}
      aria-valuenow={ariaNow}
      aria-valuetext={valueText}
    >
      <div className="absolute inset-0 rounded-full bg-muted/80" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
        style={{ width: `${pct}%` }}
      >
        <div
          className={cn(
            "h-full w-full rounded-full transition-[background-color] duration-700 ease-[var(--ease-out-soft)]",
            overflow ? "bg-destructive" : barClass,
          )}
        />
      </div>
      {showCap ? (
        <span
          className={cn(
            "absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-sm transition-[left,background-color] duration-700 ease-[var(--ease-out-soft)]",
            overflow ? "bg-destructive" : barClass,
          )}
          style={{ left: `${pct}%` }}
        />
      ) : null}
    </div>
  );
}
