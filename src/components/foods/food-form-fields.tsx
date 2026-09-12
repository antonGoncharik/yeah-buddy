"use client";

import type { FoodFormState } from "@/components/foods/food-form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { formatKcal } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";

export function FoodFormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
    </div>
  );
}

export function FoodStatePicker({
  value,
  onChange,
}: {
  value: FoodState;
  onChange: (state: FoodState) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-base font-medium">Состояние</span>
      <div className="flex flex-wrap gap-2">
        {FOOD_STATES.map((state) => (
          <Button
            key={state}
            type="button"
            variant={value === state ? "secondary" : "outline"}
            className="h-10 px-3 text-sm"
            onClick={() => onChange(state)}
          >
            {FOOD_STATE_LABELS[state]}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function FoodMacrosFields({
  form,
  autoKcal,
  onChange,
}: {
  form: FoodFormState;
  autoKcal: number | null;
  onChange: (patch: Partial<FoodFormState>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">На 100 г</p>
      <div className="grid grid-cols-2 gap-3">
        <FoodFormField label="Белки">
          <Input
            required
            inputMode="decimal"
            value={form.protein_per_100}
            onChange={(event) =>
              onChange({ protein_per_100: event.target.value })
            }
            className="h-12 text-base"
          />
        </FoodFormField>
        <FoodFormField label="Жиры">
          <Input
            required
            inputMode="decimal"
            value={form.fat_per_100}
            onChange={(event) => onChange({ fat_per_100: event.target.value })}
            className="h-12 text-base"
          />
        </FoodFormField>
        <FoodFormField label="Углеводы">
          <Input
            required
            inputMode="decimal"
            value={form.carbs_per_100}
            onChange={(event) =>
              onChange({ carbs_per_100: event.target.value })
            }
            className="h-12 text-base"
          />
        </FoodFormField>
        <div className="flex flex-col gap-2">
          <span className="text-base font-medium">Ккал</span>
          <p className="flex h-12 items-center text-base tabular-nums">
            {autoKcal == null ? "—" : formatKcal(autoKcal)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FoodYieldFields({
  form,
  onChange,
}: {
  form: FoodFormState;
  onChange: (patch: Partial<FoodFormState>) => void;
}) {
  if (form.state !== "raw" && form.state !== "dry") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">Выход после приготовления</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Шаблон в {form.state === "dry" ? "сухом," : "сыром,"} на тарелке можно
          писать готовое. Пример: 150 → 110.
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <FoodFormField label={form.state === "dry" ? "Сухое, г" : "Сырое, г"}>
          <Input
            inputMode="decimal"
            value={form.yield_from_g}
            onChange={(event) => onChange({ yield_from_g: event.target.value })}
            className="h-12 text-base"
          />
        </FoodFormField>
        <p className="pb-3 text-lg text-muted-foreground">→</p>
        <FoodFormField label="Готовое, г">
          <Input
            inputMode="decimal"
            value={form.yield_to_g}
            onChange={(event) => onChange({ yield_to_g: event.target.value })}
            className="h-12 text-base"
          />
        </FoodFormField>
      </div>
    </div>
  );
}
