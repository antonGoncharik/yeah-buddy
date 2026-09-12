"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { formatKcal } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";

export function PlateDraftNewFields({
  item,
  proteinInput,
  fatInput,
  carbsInput,
  onPatchNew,
}: {
  item: Extract<PlateDraftItem, { kind: "new" }>;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
  onPatchNew: (patch: {
    name?: string;
    state?: FoodState;
    proteinInput?: string;
    fatInput?: string;
    carbsInput?: string;
  }) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label className="text-base">Состояние</Label>
        <div className="flex flex-wrap gap-2">
          {FOOD_STATES.map((state) => (
            <Button
              key={state}
              type="button"
              variant={item.state === state ? "secondary" : "outline"}
              className="h-10 px-3 text-sm"
              onClick={() => onPatchNew({ state })}
            >
              {FOOD_STATE_LABELS[state]}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">На 100 г</p>
        <div className="grid grid-cols-3 gap-2">
          <MacroField
            label="Б"
            value={proteinInput}
            onChange={(value) => onPatchNew({ proteinInput: value })}
          />
          <MacroField
            label="Ж"
            value={fatInput}
            onChange={(value) => onPatchNew({ fatInput: value })}
          />
          <MacroField
            label="У"
            value={carbsInput}
            onChange={(value) => onPatchNew({ carbsInput: value })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {formatKcal(item.kcal_per_100)} ккал / 100 г
        </p>
      </div>
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
