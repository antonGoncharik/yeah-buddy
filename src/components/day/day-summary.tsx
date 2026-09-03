import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySummary({
  day,
  fact,
}: {
  day: Day;
  fact: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
}) {
  const remainingKcal = day.target_kcal - fact.kcal;
  const overflow = remainingKcal < 0;

  return (
    <section className="card-surface flex flex-col gap-5 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {overflow ? "Сверх плана" : "Осталось"}
        </p>
        <p
          className={cn(
            "mt-1 text-3xl font-semibold tracking-tight",
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

      <div className="flex flex-col gap-4">
        <MacroBar
          label="Белки"
          fact={fact.protein}
          plan={day.target_protein}
          barClass="bg-[var(--macro-protein)]"
        />
        <MacroBar
          label="Жиры"
          fact={fact.fat}
          plan={day.target_fat}
          barClass="bg-[var(--macro-fat)]"
        />
        <MacroBar
          label="Углеводы"
          fact={fact.carbs}
          plan={day.target_carbs}
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
  barClass,
}: {
  label: string;
  fact: number;
  plan: number;
  barClass: string;
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;

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
            "h-full rounded-full transition-[width] duration-500 ease-out",
            overflow ? "bg-destructive" : barClass,
          )}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p
        className={cn(
          "text-sm",
          overflow ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {overflow
          ? `+${formatMacro(Math.abs(remaining))}`
          : `ещё ${formatMacro(remaining)}`}
      </p>
    </div>
  );
}
