"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { formatKcal } from "@/lib/nutrition";

export function PlateDraftLumpFields({
  item,
  proteinInput,
  fatInput,
  carbsInput,
  onPatchLump,
}: {
  item: Extract<PlateDraftItem, { kind: "lump" }>;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
  onPatchLump: (patch: {
    name?: string;
    proteinInput?: string;
    fatInput?: string;
    carbsInput?: string;
  }) => void;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Сколько съел в этой порции. В продукты не попадёт.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <MacroField
          label="Белки"
          value={proteinInput}
          onChange={(value) => onPatchLump({ proteinInput: value })}
        />
        <MacroField
          label="Жиры"
          value={fatInput}
          onChange={(value) => onPatchLump({ fatInput: value })}
        />
        <MacroField
          label="Угли"
          value={carbsInput}
          onChange={(value) => onPatchLump({ carbsInput: value })}
        />
      </div>
      <p className="text-base tabular-nums">
        {item.protein + item.fat + item.carbs > 0
          ? `${formatKcal(item.kcal)} ккал`
          : "ккал посчитаются"}
      </p>
    </>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-sm">{label}</Label>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 text-base"
      />
    </div>
  );
}
