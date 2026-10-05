"use client";

import type { FoodFormState } from "@/components/foods/food-form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { formatKcal } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FoodFormField({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-0.5" : "gap-2")}>
      <Label className={compact ? "text-sm" : "text-base"}>{label}</Label>
      {children}
    </div>
  );
}

export function FoodStatePicker({
  value,
  onChange,
  compact = false,
}: {
  value: FoodState;
  onChange: (state: FoodState) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-2")}>
      <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>
        Состояние
      </span>
      <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-2")}>
        {FOOD_STATES.map((state) => (
          <Button
            key={state}
            type="button"
            variant={value === state ? "secondary" : "outline"}
            className={cn(
              "px-2.5",
              compact ? "h-8 text-xs" : "h-10 px-3 text-sm",
            )}
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
  compact = false,
}: {
  form: FoodFormState;
  autoKcal: number | null;
  onChange: (patch: Partial<FoodFormState>) => void;
  compact?: boolean;
}) {
  const inputClass = compact ? "h-10 text-base" : "h-12 text-base";
  const kcalHeight = compact ? "h-10" : "h-12";

  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-3")}>
      <p className="text-sm text-muted-foreground">На 100 г</p>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-4" : "grid-cols-2 gap-3",
        )}
      >
        <FoodFormField label="Белки" compact={compact}>
          <Input
            required
            inputMode="decimal"
            enterKeyHint="next"
            value={form.protein_per_100}
            onChange={(event) =>
              onChange({
                protein_per_100: sanitizeDecimalDraft(event.target.value),
              })
            }
            onKeyDown={handleNumericEnter}
            className={inputClass}
          />
        </FoodFormField>
        <FoodFormField label="Жиры" compact={compact}>
          <Input
            required
            inputMode="decimal"
            enterKeyHint="next"
            value={form.fat_per_100}
            onChange={(event) =>
              onChange({
                fat_per_100: sanitizeDecimalDraft(event.target.value),
              })
            }
            onKeyDown={handleNumericEnter}
            className={inputClass}
          />
        </FoodFormField>
        <FoodFormField label={compact ? "Угл." : "Углеводы"} compact={compact}>
          <Input
            required
            inputMode="decimal"
            enterKeyHint="next"
            value={form.carbs_per_100}
            onChange={(event) =>
              onChange({
                carbs_per_100: sanitizeDecimalDraft(event.target.value),
              })
            }
            onKeyDown={handleNumericEnter}
            className={inputClass}
          />
        </FoodFormField>
        <div className={cn("flex flex-col", compact ? "gap-0.5" : "gap-2")}>
          <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>
            Ккал
          </span>
          <p
            className={cn(
              "flex items-center text-base tabular-nums",
              kcalHeight,
            )}
          >
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
  compact = false,
}: {
  form: FoodFormState;
  onChange: (patch: Partial<FoodFormState>) => void;
  compact?: boolean;
}) {
  if (form.state !== "raw" && form.state !== "dry") {
    return null;
  }

  const inputClass = compact ? "h-10 text-base" : "h-12 text-base";

  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-3")}>
      <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
        Выход после приготовления
      </p>
      {compact ? null : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Шаблон в {form.state === "dry" ? "сухом," : "сыром,"} на тарелке можно
          писать готовое. Пример: 150 → 110.
        </p>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <FoodFormField
          label={form.state === "dry" ? "Сухое, г" : "Сырое, г"}
          compact={compact}
        >
          <Input
            inputMode="decimal"
            enterKeyHint="next"
            value={form.yield_from_g}
            onChange={(event) =>
              onChange({
                yield_from_g: sanitizeDecimalDraft(event.target.value),
              })
            }
            onKeyDown={handleNumericEnter}
            className={inputClass}
          />
        </FoodFormField>
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "pb-2.5 text-base" : "pb-3 text-lg",
          )}
        >
          →
        </p>
        <FoodFormField label="Готовое, г" compact={compact}>
          <Input
            inputMode="decimal"
            enterKeyHint="done"
            value={form.yield_to_g}
            onChange={(event) =>
              onChange({ yield_to_g: sanitizeDecimalDraft(event.target.value) })
            }
            onKeyDown={handleNumericEnter}
            className={inputClass}
          />
        </FoodFormField>
      </div>
    </div>
  );
}
