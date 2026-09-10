"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenLoading } from "@/components/layout/screen-status";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import { calcKcalFromMacros, formatKcal } from "@/lib/nutrition";
import { readSettingsPayload } from "@/lib/settings-map";
import type { UserSettings } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

type FormState = {
  rest_protein: string;
  rest_fat: string;
  rest_carbs: string;
  training_protein: string;
  training_fat: string;
  training_carbs: string;
};

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<FormState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);
    setSaved(false);

    try {
      await cachedGet(
        "/api/settings",
        (data) => {
          const settings = readSettings(data);
          if (!settings) {
            return false;
          }
          setForm(toFormState(settings));
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setForm(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  const restKcal = useMemo(
    () => kcalFromFields(form?.rest_protein, form?.rest_fat, form?.rest_carbs),
    [form?.rest_carbs, form?.rest_fat, form?.rest_protein],
  );
  const trainingKcal = useMemo(
    () =>
      kcalFromFields(
        form?.training_protein,
        form?.training_fat,
        form?.training_carbs,
      ),
    [form?.training_carbs, form?.training_fat, form?.training_protein],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) {
      return;
    }

    const payload = toPayload(form);
    if (!payload) {
      setError("Проверь поля.");
      setSaved(false);
      return;
    }

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const settings = readSettings(data);
      if (settings) {
        setForm(toFormState(settings));
        writeJson("/api/settings", data);
      }
      setSaved(true);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function updateField(key: keyof FormState, value: string) {
    setSaved(false);
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Настройки" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
          <h2 className="text-xl font-semibold">Тема</h2>
          <Segmented
            value={theme}
            options={[
              {
                id: "light",
                label: "Светлая",
                icon: <Sun className="size-4" aria-hidden />,
              },
              {
                id: "dark",
                label: "Тёмная",
                icon: <Moon className="size-4" aria-hidden />,
              },
            ]}
            onChange={setTheme}
          />
        </section>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && !form ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-10">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && form ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">День отдыха</h2>
              <p className="text-sm text-muted-foreground">
                На день без зала. Новый день возьмёт эти цифры.
              </p>
              <MacroField
                label="Белки"
                value={form.rest_protein}
                kcalPerGram={4}
                onChange={(value) => updateField("rest_protein", value)}
              />
              <MacroField
                label="Жиры"
                value={form.rest_fat}
                kcalPerGram={9}
                onChange={(value) => updateField("rest_fat", value)}
              />
              <MacroField
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
              <MacroField
                label="Белки"
                value={form.training_protein}
                kcalPerGram={4}
                onChange={(value) => updateField("training_protein", value)}
              />
              <MacroField
                label="Жиры"
                value={form.training_fat}
                kcalPerGram={9}
                onChange={(value) => updateField("training_fat", value)}
              />
              <MacroField
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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено.
              </p>
            ) : null}

            <Button type="submit" className="h-14 text-lg" disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </form>
        ) : null}

        <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
          <NavRow
            href="/foods"
            title="Продукты"
            hint="Название и белки, жиры, углеводы на 100 г"
          />
          <NavRow
            href="/settings/meals"
            title="Шаблоны еды"
            hint="Что подставится в новый день"
          />
          <NavRow
            href="/today/history?from=settings"
            title="История еды"
            hint="По дням"
          />
          <NavRow
            href="/settings/review"
            title="Разбор"
            hint="Еда и зал за 14 или 30 дней"
          />
          <NavRow
            href="/workouts/schedule"
            title="Очередь"
            hint="Какие дни по кругу. Состав и готовые программы"
          />
          <NavRow
            href="/settings/formulas"
            title="Схема подходов"
            hint="Как считаются веса. Готовые схемы можно поставить"
          />
          <NavRow
            href="/workouts/macro"
            title="Макроцикл"
            hint="Необязательно. Та же очередь, нагрузка по фазам"
          />
          <NavRow
            href="/onboarding?again=1"
            title="Ещё раз с начала"
            hint="Белок и рабочие веса. Очередь не трогает"
          />
        </section>
      </div>
    </div>
  );
}

function MacroField({
  label,
  value,
  kcalPerGram,
  onChange,
}: {
  label: string;
  value: string;
  kcalPerGram: number;
  onChange: (value: string) => void;
}) {
  const grams = parseMacro(value);
  const kcal = grams == null ? null : grams * kcalPerGram;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-base">{label}</Label>
        {kcal != null ? (
          <p className="text-sm text-muted-foreground">
            {formatKcal(kcal)} ккал
          </p>
        ) : null}
      </div>
      <Input
        required
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 text-base"
      />
    </div>
  );
}

function toFormState(settings: UserSettings): FormState {
  return {
    rest_protein: String(settings.rest_protein),
    rest_fat: String(settings.rest_fat),
    rest_carbs: String(settings.rest_carbs),
    training_protein: String(settings.training_protein),
    training_fat: String(settings.training_fat),
    training_carbs: String(settings.training_carbs),
  };
}

function toPayload(form: FormState) {
  const rest_protein = parseMacro(form.rest_protein);
  const rest_fat = parseMacro(form.rest_fat);
  const rest_carbs = parseMacro(form.rest_carbs);
  const training_protein = parseMacro(form.training_protein);
  const training_fat = parseMacro(form.training_fat);
  const training_carbs = parseMacro(form.training_carbs);

  if (
    rest_protein == null ||
    rest_fat == null ||
    rest_carbs == null ||
    training_protein == null ||
    training_fat == null ||
    training_carbs == null
  ) {
    return null;
  }

  return {
    rest_protein,
    rest_fat,
    rest_carbs,
    training_protein,
    training_fat,
    training_carbs,
  };
}

function parseMacro(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

function kcalFromFields(
  proteinRaw: string | undefined,
  fatRaw: string | undefined,
  carbsRaw: string | undefined,
): number | null {
  if (proteinRaw == null || fatRaw == null || carbsRaw == null) {
    return null;
  }

  const protein = parseMacro(proteinRaw);
  const fat = parseMacro(fatRaw);
  const carbs = parseMacro(carbsRaw);
  if (protein == null || fat == null || carbs == null) {
    return null;
  }

  return calcKcalFromMacros(protein, fat, carbs);
}

function readSettings(data: unknown): UserSettings | null {
  return readSettingsPayload(data);
}
