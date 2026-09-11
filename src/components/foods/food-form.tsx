"use client";

import { useFoodForm } from "@/components/foods/use-food-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { formatKcal } from "@/lib/nutrition";
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

  return (
    <form className="animate-rise flex flex-col gap-4 pb-8" onSubmit={onSubmit}>
      <Field label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          className="h-12 text-base"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-base font-medium">Состояние</span>
        <div className="flex flex-wrap gap-2">
          {FOOD_STATES.map((state) => (
            <Button
              key={state}
              type="button"
              variant={form.state === state ? "secondary" : "outline"}
              className="h-10 px-3 text-sm"
              onClick={() => setForm((current) => ({ ...current, state }))}
            >
              {FOOD_STATE_LABELS[state]}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Как на пачке: белок, жир, углеводы на 100 г. Пример: творог 5% — 17 / 5
        / 2, порция 150 г.
      </p>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">На 100 г</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Белки">
            <Input
              required
              inputMode="decimal"
              value={form.protein_per_100}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  protein_per_100: event.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </Field>
          <Field label="Жиры">
            <Input
              required
              inputMode="decimal"
              value={form.fat_per_100}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fat_per_100: event.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </Field>
          <Field label="Углеводы">
            <Input
              required
              inputMode="decimal"
              value={form.carbs_per_100}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  carbs_per_100: event.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">Ккал</span>
            <p className="flex h-12 items-center text-base tabular-nums">
              {autoKcal == null ? "—" : formatKcal(autoKcal)}
            </p>
          </div>
        </div>
      </div>

      <Field label="Порция, г">
        <Input
          inputMode="decimal"
          value={form.default_portion_g}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              default_portion_g: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      {form.state === "raw" || form.state === "dry" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Выход после приготовления</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Шаблон в {form.state === "dry" ? "сухом," : "сыром,"} на тарелке
              можно писать готовое. Пример: 150 → 110.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <Field label={form.state === "dry" ? "Сухое, г" : "Сырое, г"}>
              <Input
                inputMode="decimal"
                value={form.yield_from_g}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    yield_from_g: event.target.value,
                  }))
                }
                className="h-12 text-base"
              />
            </Field>
            <p className="pb-3 text-lg text-muted-foreground">→</p>
            <Field label="Готовое, г">
              <Input
                inputMode="decimal"
                value={form.yield_to_g}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    yield_to_g: event.target.value,
                  }))
                }
                className="h-12 text-base"
              />
            </Field>
          </div>
        </div>
      ) : null}

      <label className="flex min-h-12 items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              is_favorite: event.target.checked,
            }))
          }
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

function Field({
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
