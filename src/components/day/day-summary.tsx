import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySummary({
  day,
  fact,
  factLabel = "Съел",
}: {
  day: Pick<
    Day,
    "target_protein" | "target_fat" | "target_carbs" | "target_kcal"
  >;
  fact: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
  factLabel?: string;
}) {
  const remainingKcal = day.target_kcal - fact.kcal;
  const overflow = remainingKcal < 0;

  return (
    <section className="card-surface flex flex-col gap-5 px-5 py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {overflow ? "Сверх плана" : "Осталось"}
          </p>
          <p
            className={cn(
              "mt-1 text-3xl font-semibold tracking-tight transition-colors duration-300 ease-[var(--ease-out-soft)]",
              overflow && "text-destructive",
            )}
          >
            {overflow
              ? `+${formatKcal(Math.abs(remainingKcal))}`
              : formatKcal(remainingKcal)}
            <span className="ml-1.5 text-lg font-medium text-muted-foreground">
              ккал
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">
            {factLabel}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
            {formatKcal(fact.kcal)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MacroBar
          label="Белки"
          fact={fact.protein}
          plan={day.target_protein}
          kcalPerGram={4}
          barClass="bg-[var(--macro-protein)]"
        />
        <MacroBar
          label="Жиры"
          fact={fact.fat}
          plan={day.target_fat}
          kcalPerGram={9}
          barClass="bg-[var(--macro-fat)]"
        />
        <MacroBar
          label="Углеводы"
          fact={fact.carbs}
          plan={day.target_carbs}
          kcalPerGram={4}
          barClass="bg-[var(--macro-carbs)]"
        />
      </div>
    </section>
  );
}

function MacroBar({
  label,
  fact,
  plan,
  kcalPerGram,
  barClass,
}: {
  label: string;
  fact: number;
  plan: number;
  kcalPerGram: number;
  barClass: string;
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;
  const remainingKcal = Math.abs(remaining) * kcalPerGram;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-base">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          <span className="text-foreground">{formatMacro(fact)}</span>
          <span> / {formatMacro(plan)}</span>
        </p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-700 ease-[var(--ease-out-soft)]",
            overflow ? "bg-destructive" : barClass,
          )}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p
        className={cn(
          "text-sm transition-colors duration-300 ease-[var(--ease-out-soft)]",
          overflow ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {overflow
          ? `+${formatMacro(Math.abs(remaining))} · +${formatKcal(remainingKcal)} ккал`
          : `ещё ${formatMacro(remaining)} · ${formatKcal(remainingKcal)} ккал`}
      </p>
    </div>
  );
}
