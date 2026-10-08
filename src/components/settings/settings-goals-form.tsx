"use client";

import { StickyActions } from "@/components/layout/sticky-actions";
import { GoalOptionButtons } from "@/components/nutrition/goal-option-buttons";
import type {
  MacroFieldKey,
  SettingsFormState,
} from "@/components/settings/settings-form-state";
import { SettingsMacroField } from "@/components/settings/settings-macro-field";
import { Button } from "@/components/ui/button";
import {
  formatKcal,
  ONBOARDING_SEX_OPTIONS,
  type OnboardingGoal,
  type OnboardingSex,
} from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { UserTrainingAge } from "@/lib/types";
import { TRAINING_AGE_OPTIONS } from "@/lib/workout/estimate-maxes";
import { formatWeight } from "@/lib/workout/numbers";

export function SettingsGoalsForm({
  form,
  restKcal,
  trainingKcal,
  bodyWeight,
  error,
  saved,
  saving,
  onSubmit,
  updateField,
  updateSex,
  updateGoal,
  updateTrainingAge,
  onRecount,
  showTrainingGoals = true,
}: {
  form: SettingsFormState;
  restKcal: number | null;
  trainingKcal: number | null;
  bodyWeight: number | null;
  error: string | null;
  saved: boolean;
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  updateField: (key: MacroFieldKey, value: string) => void;
  updateSex: (value: OnboardingSex) => void;
  updateGoal: (value: OnboardingGoal) => void;
  updateTrainingAge: (value: UserTrainingAge) => void;
  onRecount: () => void;
  showTrainingGoals?: boolean;
}) {
  const canRecount =
    form.sex != null && form.goal != null && bodyWeight != null;

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
        <h2 className="text-xl font-semibold">Кто ты и цель</h2>
        <p className="text-sm text-muted-foreground">
          От этого считали белок, жир и калории. Можно поменять и пересчитать.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ONBOARDING_SEX_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={form.sex === option.id ? "default" : "outline"}
              className="h-12 text-base"
              onClick={() => {
                if (form.sex !== option.id) {
                  haptic("tick");
                }
                updateSex(option.id);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <GoalOptionButtons
          value={form.goal}
          onPick={updateGoal}
          size="compact"
        />
        {showTrainingGoals ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">Стаж</p>
            <div className="flex flex-col gap-2">
              {TRAINING_AGE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={
                    form.training_age === option.id ? "default" : "outline"
                  }
                  className="h-12 justify-start text-base"
                  onClick={() => {
                    if (form.training_age !== option.id) {
                      haptic("tick");
                    }
                    updateTrainingAge(option.id);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </>
        ) : null}
        {bodyWeight != null ? (
          <p className="text-sm text-muted-foreground">
            Вес для счёта — {formatWeight(bodyWeight)} кг (с «Сегодня»).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Веса ещё нет — запиши его на «Сегодня», тогда можно пересчитать
            белок.
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={!canRecount}
          onClick={() => {
            haptic("tap");
            onRecount();
          }}
        >
          Пересчитать цели
        </Button>
      </section>

      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
        <h2 className="text-xl font-semibold">
          {showTrainingGoals ? "День отдыха" : "Цели на день"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {showTrainingGoals ? "На день без зала." : "Белок, жир и углеводы."}
        </p>
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

      {showTrainingGoals ? (
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
      ) : null}

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
