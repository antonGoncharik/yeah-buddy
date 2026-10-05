"use client";

import {
  FoodFormField,
  FoodMacrosFields,
  FoodStatePicker,
  FoodYieldFields,
} from "@/components/foods/food-form-fields";
import { useFoodForm } from "@/components/foods/use-food-form";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { GramsStepperInput } from "@/components/ui/grams-stepper";
import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FoodForm({
  food,
  afterCreateHref,
  compact = false,
}: {
  food?: Food;
  afterCreateHref?: (foodId: string) => string;
  /** Tighter layout for the catalog product card on small screens. */
  compact?: boolean;
}) {
  const {
    form,
    setForm,
    error,
    saving,
    deleting,
    autoKcal,
    onSubmit,
    onDelete,
  } = useFoodForm({ food, afterCreateHref });

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }));
  }

  return (
    <form
      className={cn(
        "animate-rise flex flex-col pb-[var(--app-field-scroll-pad)]",
        compact ? "gap-2" : "gap-4",
      )}
      onSubmit={onSubmit}
    >
      <FoodFormField label="Название" compact={compact}>
        <Input
          required
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          onKeyDown={handleNumericEnter}
          enterKeyHint="next"
          className={compact ? "h-10 text-base" : "h-12 text-base"}
        />
      </FoodFormField>

      <FoodStatePicker
        value={form.state}
        compact={compact}
        onChange={(state) => patch({ state })}
      />

      <label
        className={cn(
          "flex items-center gap-2 font-medium",
          compact ? "min-h-9 text-sm" : "min-h-12 gap-3 text-base",
        )}
      >
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) => patch({ is_favorite: event.target.checked })}
          className={compact ? "size-4" : "size-5"}
        />
        Избранное
      </label>

      {compact ? null : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Как на пачке: белок, жир, углеводы на 100 г. Пример: творог 5% — 17 /
          5 / 2, порция 150 г.
        </p>
      )}

      <FoodMacrosFields
        form={form}
        autoKcal={autoKcal}
        compact={compact}
        onChange={patch}
      />

      <FoodFormField label="Порция, г" compact={compact}>
        <GramsStepperInput
          size={compact ? "sm" : "md"}
          value={form.default_portion_g}
          aria-label="Порция, г"
          onChange={(value) =>
            patch({
              default_portion_g: sanitizeDecimalDraft(value),
              default_portion_label: "",
            })
          }
        />
      </FoodFormField>

      <FoodYieldFields form={form} compact={compact} onChange={patch} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {food ? (
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "text-destructive",
            compact ? "mt-0 h-10 text-sm" : "mt-2 h-12 text-base",
          )}
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "Удаление…" : "Удалить продукт"}
        </Button>
      ) : null}

      <StickyActions>
        <Button
          type="submit"
          className={compact ? "h-12 text-base" : "h-14 text-lg"}
          disabled={saving || deleting}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}
