"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { FormulaCycleEditor } from "@/components/workout/formula-cycle-editor";
import {
  patchBaseWork,
  patchWarmup,
  toPayload,
} from "@/components/workout/formula-form";
import { SetCard } from "@/components/workout/formula-set-card";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import {
  applyWorkPattern,
  raisedMaxForPhase,
  withCycle,
} from "@/lib/workout/cycle";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
  FORMULA_SYSTEMS,
} from "@/lib/workout/default-formulas";
import { previewMaxForPhase } from "@/lib/workout/formulas";
import {
  FORMULA_PRESET_LABELS,
  FORMULAS_LABEL,
  WARMUP_PRESET_IDS,
  WEIGHT_STEP_OPTIONS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const SETTINGS_URL = "/api/workout-settings";

type KindTab = WorkoutKind;

export function FormulasScreen() {
  const confirm = useConfirm();
  const [kind, setKind] = useState<KindTab>("dynamic");
  const [maxIncrease, setMaxIncrease] = useState("5");
  const [formulas, setFormulas] = useState<WorkoutFormulas | null>(null);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [previewMax, setPreviewMax] = useState({
    dynamic: "220",
    static: "76",
  });
  const [previewStep, setPreviewStep] = useState({ dynamic: 2.5, static: 1 });
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
        SETTINGS_URL,
        (data) => {
          const settings = readWorkoutSettingsPayload(data);
          if (!settings) {
            return false;
          }
          setFormulas(cloneFormulas(settings.formulas));
          setMaxIncrease(String(settings.max_increase_percent));
          setCycleOpen(settings.formulas.cycle.length > 0);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setFormulas(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!formulas) {
      return;
    }

    const payload = toPayload(maxIncrease, formulas);
    if (!payload) {
      setError("Проверь проценты, подходы и повторы.");
      setSaved(false);
      return;
    }

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const data = await patchJson(SETTINGS_URL, payload);
      const settings = readWorkoutSettingsPayload(data);
      if (settings) {
        setFormulas(cloneFormulas(settings.formulas));
        setMaxIncrease(String(settings.max_increase_percent));
        writeJson(SETTINGS_URL, data);
      }
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    const ok = await confirm({
      message: "Вернуть 3×5 без этапов? Сейчас всё заменится.",
      confirmLabel: "Вернуть",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(cloneFormulas(DEFAULT_WORKOUT_FORMULAS));
    setMaxIncrease("5");
    setCycleOpen(false);
    setSaved(false);
    setError(null);
  }

  async function applySystem(id: (typeof FORMULA_SYSTEMS)[number]["id"]) {
    const system = FORMULA_SYSTEMS.find((item) => item.id === id);
    if (!system || !formulas) {
      return;
    }
    const ok = await confirm({
      message: formulas.cycle.length
        ? `Поставить «${system.name}»? Рабочие в этапах тоже сменятся, сами этапы останутся.`
        : `Поставить «${system.name}»? Текущие подходы заменятся.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(applyWorkPattern(formulas, system.formulas));
    setSaved(false);
    setError(null);
  }

  async function applyCycleTemplate(cycle: CyclePhaseDef[], name: string) {
    if (!formulas) {
      return;
    }
    const ok = await confirm({
      message: `Поставить цикл «${name}»? Этапы и рабочие в них заменятся.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(withCycle(formulas, cycle));
    setCycleOpen(true);
    setSaved(false);
    setError(null);
  }

  async function clearCycle() {
    if (!formulas) {
      return;
    }
    const ok = await confirm({
      message: "Убрать этапы? Веса всегда как в рабочих ниже.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(withCycle(formulas, []));
    setSaved(false);
    setError(null);
  }

  const exampleMax = parseDecimal(previewMax[kind]) ?? 0;
  const exampleStep = previewStep[kind];
  const increasePercent = parseDecimal(maxIncrease) ?? 0;
  const showsIncrease = Boolean(
    formulas?.cycle.some((phase) => phase.increase_on_end),
  );
  const raisedExample =
    exampleMax > 0 && showsIncrease
      ? previewMaxForPhase(
          formulas?.cycle ?? [],
          formulas?.cycle.find((phase) =>
            raisedMaxForPhase(formulas.cycle, phase.key),
          )?.key ?? "peak",
          exampleMax,
          increasePercent,
          exampleStep,
        )
      : exampleMax;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={FORMULAS_LABEL}
        subtitle="От твоего веса"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Как считать</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Твой вес × процент, вниз до шага блинов. Без цикла — как в
                рабочих. С этапом — как в нём.
              </p>
            </section>

            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Поставить</h2>
              <div className="flex flex-col gap-2">
                {FORMULA_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => void applySystem(system.id)}
                  >
                    <p className="text-base font-medium">{system.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {system.hint}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {showsIncrease ? (
              <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold">Плюс</h2>
                  <p className="text-sm text-muted-foreground">
                    к рабочему весу
                  </p>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground">
                  На сколько поднять рабочие, когда этап это разрешает. Не всем
                  сразу.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={maxIncrease}
                    onChange={(event) => {
                      setMaxIncrease(event.target.value);
                      setSaved(false);
                    }}
                    className="h-12 w-24 text-base"
                    aria-label="Плюс к рабочему весу"
                  />
                  <span className="text-lg text-muted-foreground">%</span>
                </div>
              </section>
            ) : null}

            <Segmented
              value={kind}
              options={[
                { id: "dynamic", label: WORKOUT_KIND_LABELS.dynamic },
                { id: "static", label: WORKOUT_KIND_LABELS.static },
              ]}
              onChange={setKind}
            />

            <section className="card-surface flex flex-col gap-3 px-5 py-4">
              <h2 className="text-lg font-semibold">Пример веса</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Справа килограммы, если подставить вес. В дневник не пишется.
                {raisedExample > 0 &&
                raisedExample !== exampleMax &&
                showsIncrease
                  ? ` После плюса — от ${formatWeight(raisedExample)} кг.`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="decimal"
                  value={previewMax[kind]}
                  onChange={(event) =>
                    setPreviewMax((current) => ({
                      ...current,
                      [kind]: event.target.value,
                    }))
                  }
                  className="h-12 flex-1 text-base"
                  aria-label="Пример рабочего веса"
                />
                <span className="text-base text-muted-foreground">кг</span>
              </div>
              <Segmented
                value={String(exampleStep)}
                options={WEIGHT_STEP_OPTIONS.map((step) => ({
                  id: String(step),
                  label: `${step}`,
                }))}
                onChange={(step) =>
                  setPreviewStep((current) => ({
                    ...current,
                    [kind]: Number(step),
                  }))
                }
              />
            </section>

            <p className="px-1 text-base leading-relaxed text-muted-foreground">
              {kind === "dynamic"
                ? "Разминка — штанга или блок, как в упражнении. Повторы можно сменить на секунды."
                : "Разминка обычно в повторах, рабочие — в секундах. Можно наоборот."}
            </p>
            {WARMUP_PRESET_IDS.map((preset) => (
              <SetCard
                key={preset}
                title={FORMULA_PRESET_LABELS[preset]}
                hint="Разминка"
                defaultHold={false}
                sets={formulas.warmups[kind][preset]}
                exampleMax={exampleMax}
                exampleStep={exampleStep}
                allowEmpty
                onChange={(sets) => {
                  setSaved(false);
                  setFormulas((current) =>
                    current
                      ? patchWarmup(current, kind, preset, sets)
                      : current,
                  );
                }}
              />
            ))}
            <SetCard
              title="Рабочие"
              hint={
                formulas.cycle.length > 0 ? "Без цикла" : "От рабочего веса"
              }
              defaultHold={kind === "static"}
              sets={formulas[kind].base.work}
              exampleMax={exampleMax}
              exampleStep={exampleStep}
              onChange={(work) => {
                setSaved(false);
                setFormulas((current) =>
                  current ? patchBaseWork(current, kind, work) : current,
                );
              }}
            />

            <FormulaCycleEditor
              formulas={formulas}
              kind={kind}
              exampleMax={exampleMax}
              exampleStep={exampleStep}
              increasePercent={increasePercent}
              cycleOpen={cycleOpen}
              setCycleOpen={setCycleOpen}
              setFormulas={setFormulas}
              setSaved={setSaved}
              applyCycleTemplate={applyCycleTemplate}
              clearCycle={clearCycle}
            />

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено. Следующая тренировка — по этим подходам.
              </p>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className="h-12 text-base"
              disabled={saving}
              onClick={() => void restoreDefaults()}
            >
              Вернуть 3×5
            </Button>
            <StickyActions>
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={saving}
                onClick={() => void onSave()}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </StickyActions>
          </>
        ) : null}
      </div>
    </div>
  );
}
