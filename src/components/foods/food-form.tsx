"use client";

import {
  FoodFormField,
  FoodMacrosFields,
  FoodStatePicker,
  FoodYieldFields,
} from "@/components/foods/food-form-fields";
import { useFoodForm } from "@/components/foods/use-food-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form className="animate-rise flex flex-col gap-4 pb-8" onSubmit={onSubmit}>
      <FoodFormField label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          className="h-12 text-base"
        />
      </FoodFormField>

      <FoodStatePicker
        value={form.state}
        onChange={(state) => patch({ state })}
      />

      <p className="text-sm leading-relaxed text-muted-foreground">
        Как на пачке: белок, жир, углеводы на 100 г. Пример: творог 5% — 17 / 5
        / 2, порция 150 г.
      </p>

      <FoodMacrosFields form={form} autoKcal={autoKcal} onChange={patch} />

      <FoodFormField label="Порция, г">
        <Input
          inputMode="decimal"
          value={form.default_portion_g}
          onChange={(event) => patch({ default_portion_g: event.target.value })}
          className="h-12 text-base"
        />
      </FoodFormField>

      <FoodYieldFields form={form} onChange={patch} />

      <label className="flex min-h-12 items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) => patch({ is_favorite: event.target.checked })}
          className="size-5"
        />
        Избранное
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {food ? (
        <Button
          type="button"
          variant="destructive"
          className="h-12 text-base"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "Удаление…" : "Удалить"}
        </Button>
      ) : null}

      <Button
        type="submit"
        className="h-14 text-lg"
        disabled={saving || deleting}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
