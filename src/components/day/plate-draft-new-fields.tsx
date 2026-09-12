"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { handleNumericEnter } from "@/lib/form/field-nav";
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
      <div className="grid grid-cols-3 gap-2" data-field-group>
        <MacroField
          label="Белки"
          value={proteinInput}
          enterKeyHint="next"
          onChange={(value) => onPatchLump({ proteinInput: value })}
        />
        <MacroField
          label="Жиры"
          value={fatInput}
          enterKeyHint="next"
          onChange={(value) => onPatchLump({ fatInput: value })}
        />
        <MacroField
          label="Угли"
          value={carbsInput}
          enterKeyHint="done"
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
  enterKeyHint,
  onChange,
}: {
  label: string;
  value: string;
  enterKeyHint: "next" | "done";
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-sm">{label}</Label>
      <Input
        inputMode="decimal"
        enterKeyHint={enterKeyHint}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleNumericEnter}
        className="h-12 text-base"
      />
    </div>
  );
}
