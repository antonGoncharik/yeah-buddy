"use client";

import { StickyActions } from "@/components/layout/sticky-actions";
import type {
  MacroFieldKey,
  SettingsFormState,
} from "@/components/settings/settings-form-state";
import { SettingsMacroField } from "@/components/settings/settings-macro-field";
import { Button } from "@/components/ui/button";
import { formatKcal } from "@/lib/nutrition";

export function SettingsGoalsForm({
  form,
  restKcal,
  trainingKcal,
  error,
  saved,
  saving,
  onSubmit,
  updateField,
  updateYears,
}: {
  form: SettingsFormState;
  restKcal: number | null;
  trainingKcal: number | null;
  error: string | null;
  saved: boolean;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  updateField: (key: MacroFieldKey, value: string) => void;
  updateYears: (value: string) => void;
}) {
  return (
    <form className="flex flex-col gap-4 pb-28" onSubmit={onSubmit}>
      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
        <h2 className="text-xl font-semibold">День отдыха</h2>
        <p className="text-sm text-muted-foreground">На день без зала.</p>
        <SettingsMacroField
          label="Белки"
          value={form.rest_protein}
          kcalPerGram={4}
          onChange={(value) => updateField("rest_protein", value)}
        />
        <SettingsMacroField
          label="Жиры"
          value={form.rest_fat}
          kcalPerGram={9}
          onChange={(value) => updateField("rest_fat", value)}
        />
        <SettingsMacroField
          label="Углеводы"
          value={form.rest_carbs}
          kcalPerGram={4}
          onChange={(value) => updateField("rest_carbs", value)}
        />
        {restKcal != null ? (
          <p className="text-sm text-muted-foreground">
            {formatKcal(restKcal)} ккал
          </p>
        ) : null}
      </section>

      <section
        className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        style={{ animationDelay: "50ms" }}
      >
        <h2 className="text-xl font-semibold">День тренировки</h2>
        <p className="text-sm text-muted-foreground">
          На день с залом. Обычно больше углеводов.
        </p>
        <SettingsMacroField
          label="Белки"
          value={form.training_protein}
          kcalPerGram={4}
          onChange={(value) => updateField("training_protein", value)}
        />
        <SettingsMacroField
          label="Жиры"
          value={form.training_fat}
          kcalPerGram={9}
          onChange={(value) => updateField("training_fat", value)}
        />
        <SettingsMacroField
          label="Углеводы"
          value={form.training_carbs}
          kcalPerGram={4}
          onChange={(value) => updateField("training_carbs", value)}
        />
        {trainingKcal != null ? (
          <p className="text-sm text-muted-foreground">
            {formatKcal(trainingKcal)} ккал
          </p>
        ) : null}
      </section>

      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
        <h2 className="text-xl font-semibold">Лет в зале</h2>
        <p className="text-sm text-muted-foreground">
          Чтобы застой читался по стажу. Можно не заполнять.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Лет</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            aria-label="Сколько лет в зале"
            value={form.training_years}
            placeholder="не указано"
            onChange={(event) => updateYears(event.target.value)}
            className="field-control h-12 w-24 rounded-xl border border-input/70 bg-input-bg px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="animate-fade text-sm text-muted-foreground">Сохранено.</p>
      ) : null}

      <StickyActions>
        <Button type="submit" className="h-14 text-lg" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
    </form>
  );
}
