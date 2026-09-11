"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";

export function PlateDraftRow({
  item,
  gramsInput,
  onGramsChange,
  onRemove,
}: {
  item: PlateDraftItem;
  gramsInput: string;
  onGramsChange: (value: string) => void;
  onRemove: () => void;
}) {
  const grams = Number(gramsInput.replace(",", "."));
  const totals =
    Number.isFinite(grams) && grams > 0
      ? calcMacrosFromPer100(
          {
            protein: item.protein_per_100,
            fat: item.fat_per_100,
            carbs: item.carbs_per_100,
            kcal: item.kcal_per_100,
          },
          grams,
        )
      : null;

  return (
    <div className="card-surface flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-lg font-medium">{item.name}</p>
            {item.kind === "new" ? (
              <span className="text-sm text-muted-foreground">новый</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            На 100 г: Б {formatMacro(item.protein_per_100)} · Ж{" "}
            {formatMacro(item.fat_per_100)} · У{" "}
            {formatMacro(item.carbs_per_100)}
          </p>
        </div>
        <RemoveRowButton onClick={onRemove} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-base">Граммы</Label>
        <Input
          inputMode="decimal"
          value={gramsInput}
          onChange={(event) => onGramsChange(event.target.value)}
          className="h-12 text-lg"
        />
      </div>

      {totals ? (
        <p className="text-base tabular-nums">
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </p>
      ) : null}
    </div>
  );
}
