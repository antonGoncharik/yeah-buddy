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

export function FoodForm({
  food,
  afterCreateHref,
}: {
  food?: Food;
  afterCreateHref?: (foodId: string) => string;
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
      className="animate-rise flex flex-col gap-2.5 pb-[var(--app-field-scroll-pad)]"
      onSubmit={onSubmit}
    >
      <FoodFormField label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          onKeyDown={handleNumericEnter}
          enterKeyHint="next"
          className="h-11 text-base"
        />
      </FoodFormField>

      <FoodStatePicker
        value={form.state}
        onChange={(state) => patch({ state })}
      />

      <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) => patch({ is_favorite: event.target.checked })}
          className="size-4"
        />
        Избранное
      </label>

      <FoodMacrosFields form={form} autoKcal={autoKcal} onChange={patch} />

      <FoodFormField label="Порция, г">
        <GramsStepperInput
          size="md"
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

      <FoodYieldFields form={form} onChange={patch} />

      {error ? <p className="text-base leading-snug text-destructive">{error}</p> : null}

      {food ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base leading-snug text-destructive"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "Удаление…" : "Удалить продукт"}
        </Button>
      ) : null}

      <StickyActions>
        <Button
          type="submit"
          className="h-12 text-base"
          disabled={saving || deleting}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}
