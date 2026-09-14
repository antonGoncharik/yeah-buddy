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
import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
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
      className="animate-rise flex flex-col gap-4 pb-[var(--app-field-scroll-pad)]"
      onSubmit={onSubmit}
    >
      <FoodFormField label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          onKeyDown={handleNumericEnter}
          enterKeyHint="next"
          className="h-12 text-base"
        />
      </FoodFormField>

      <FoodStatePicker
        value={form.state}
        onChange={(state) => patch({ state })}
      />

      <label className="flex min-h-12 items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) => patch({ is_favorite: event.target.checked })}
          className="size-5"
        />
        Избранное
      </label>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Как на пачке: белок, жир, углеводы на 100 г. Пример: творог 5% — 17 / 5
        / 2, порция 150 г.
      </p>

      <FoodMacrosFields form={form} autoKcal={autoKcal} onChange={patch} />

      <FoodFormField label="Порция, г">
        <Input
          inputMode="decimal"
          enterKeyHint="next"
          value={form.default_portion_g}
          onChange={(event) => patch({ default_portion_g: event.target.value })}
          onKeyDown={handleNumericEnter}
          className="h-12 text-base"
        />
      </FoodFormField>

      <FoodYieldFields form={form} onChange={patch} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {food ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-12 text-base text-destructive"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "Удаление…" : "Удалить продукт"}
        </Button>
      ) : null}

      <StickyActions>
        <Button
          type="submit"
          className="h-14 text-lg"
          disabled={saving || deleting}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}
