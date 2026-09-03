import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Day } from "@/lib/types";

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
  return (
    <section className="rounded-xl border bg-card px-4 py-3">
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <p />
        <p className="font-medium text-muted-foreground">Факт</p>
        <p className="font-medium text-muted-foreground">План</p>
        <p className="font-medium text-muted-foreground">Осталось</p>
        <MacroRow label="Белки" fact={fact.protein} plan={day.target_protein} />
        <MacroRow label="Жиры" fact={fact.fat} plan={day.target_fat} />
        <MacroRow label="Углеводы" fact={fact.carbs} plan={day.target_carbs} />
        <MacroRow label="Ккал" fact={fact.kcal} plan={day.target_kcal} kcal />
      </div>
    </section>
  );
}

function MacroRow({
  label,
  fact,
  plan,
  kcal = false,
}: {
  label: string;
  fact: number;
  plan: number;
  kcal?: boolean;
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const format = kcal ? formatKcal : formatMacro;

  return (
    <>
      <p className="text-left font-medium">{label}</p>
      <p>{format(fact)}</p>
      <p>{format(plan)}</p>
      <p className={overflow ? "text-destructive" : undefined}>
        {overflow ? `+${format(Math.abs(remaining))}` : format(remaining)}
      </p>
    </>
  );
}
