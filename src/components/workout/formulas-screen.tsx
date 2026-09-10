"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  FormulaSetSpec,
  PhaseType,
  WarmupPresetId,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
  FORMULA_SYSTEMS,
} from "@/lib/workout/default-formulas";
import {
  calcPlannedWeight,
  previewMaxForPhase,
  setUsesHold,
} from "@/lib/workout/formulas";
import {
  FORMULA_PRESET_LABELS,
  PHASE_TYPE_LABELS,
  PHASE_TYPES,
  WARMUP_PRESET_IDS,
  WEIGHT_STEP_OPTIONS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const MAX_SETS = 8;
const SETTINGS_URL = "/api/workout-settings";

type KindTab = WorkoutKind;

export function FormulasScreen() {
  const confirm = useConfirm();
  const [kind, setKind] = useState<KindTab>("dynamic");
  const [maxIncrease, setMaxIncrease] = useState("5");
  const [formulas, setFormulas] = useState<WorkoutFormulas | null>(null);
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
          const settings = readSettings(data);
          if (!settings) {
            return false;
          }
          setFormulas(cloneFormulas(settings.formulas));
          setMaxIncrease(String(settings.max_increase_percent));
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
      const response = await fetch(SETTINGS_URL, {
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
        setFormulas(cloneFormulas(settings.formulas));
        setMaxIncrease(String(settings.max_increase_percent));
        writeJson(SETTINGS_URL, data);
      }
      setSaved(true);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    const ok = await confirm({
      message: "Вернуть схему 3×5? Сейчас всё заменится.",
      confirmLabel: "Вернуть",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(cloneFormulas(DEFAULT_WORKOUT_FORMULAS));
    setMaxIncrease("5");
    setSaved(false);
    setError(null);
  }

  async function applySystem(id: (typeof FORMULA_SYSTEMS)[number]["id"]) {
    const system = FORMULA_SYSTEMS.find((item) => item.id === id);
    if (!system) {
      return;
    }
    const ok = await confirm({
      message: `Поставить схему «${system.name}»? Текущая заменится.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(cloneFormulas(system.formulas));
    setSaved(false);
    setError(null);
  }

  const exampleMax = parseDecimal(previewMax[kind]) ?? 0;
  const exampleStep = previewStep[kind];
  const increasePercent = parseDecimal(maxIncrease) ?? 0;
  const raisedMax =
    exampleMax > 0
      ? previewMaxForPhase("peak", exampleMax, increasePercent, exampleStep)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Схема подходов"
        subtitle="Как считаются веса в зале"
        backHref="/settings"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Как это работает</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Это не очередь и не макроцикл. Только как считать подходы от
                рабочего веса: процент, округление вниз до шага блинов. Разминка
                — своя на динамику и статику, штанга или блок. Готовая схема
                ставится целиком — потом правишь как хочешь.
              </p>
            </section>

            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Готовая схема</h2>
              <div className="flex flex-col gap-2">
                {FORMULA_SYSTEMS.map((system) => (
                  <button
                    key={system.id}
                    type="button"
                    className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => applySystem(system.id)}
                  >
                    <p className="text-base font-medium">{system.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {system.hint}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">На рывке</h2>
                <p className="text-sm text-muted-foreground">к рабочему весу</p>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                Когда закрываешь набор, можно поднять рабочие веса на этот
                процент. Не обязательно всем — поправишь перед подтверждением. В
                примере ниже рывок и сброс уже от нового веса.
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
                  aria-label="Прирост рабочего веса на рывке"
                />
                <span className="text-lg text-muted-foreground">%</span>
              </div>
            </section>

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
                Подставь рабочий вес — справа в подходах появятся килограммы.
                Это пример, в дневник не пишется.
                {raisedMax > 0 && raisedMax !== exampleMax
                  ? ` Рывок и сброс от ${formatWeight(raisedMax)} кг.`
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

            {kind === "dynamic" ? (
              <>
                <p className="px-1 text-base leading-relaxed text-muted-foreground">
                  Разминка берётся из упражнения (штанга или блок). Рабочие
                  зависят от фазы. В рывке разминка тоже от нового веса. В
                  подходе можно сменить повторы на секунды.
                </p>
                {WARMUP_PRESET_IDS.map((preset) => (
                  <SetCard
                    key={preset}
                    title={FORMULA_PRESET_LABELS[preset]}
                    hint="Разминка"
                    defaultHold={false}
                    sets={formulas.warmups.dynamic[preset]}
                    exampleMax={exampleMax}
                    exampleStep={exampleStep}
                    allowEmpty
                    onChange={(sets) => {
                      setSaved(false);
                      setFormulas((current) =>
                        current
                          ? patchWarmup(current, "dynamic", preset, sets)
                          : current,
                      );
                    }}
                  />
                ))}
                {PHASE_TYPES.map((phase) => (
                  <SetCard
                    key={phase}
                    title={PHASE_TYPE_LABELS[phase]}
                    hint={phaseWorkHint(phase, exampleMax, raisedMax)}
                    defaultHold={false}
                    sets={formulas.dynamic[phase].work}
                    exampleMax={previewMaxForPhase(
                      phase,
                      exampleMax,
                      increasePercent,
                      exampleStep,
                    )}
                    exampleStep={exampleStep}
                    onChange={(work) => {
                      setSaved(false);
                      setFormulas((current) =>
                        current
                          ? patchPhaseWork(current, "dynamic", phase, work)
                          : current,
                      );
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                <p className="px-1 text-base leading-relaxed text-muted-foreground">
                  Статическая разминка своя: обычно повторы, третий подход —
                  удержание 2 с на рабочем весе. Рабочие — секунды, но любой
                  подход можно сделать повторами. Сброс без разминки.
                </p>
                {WARMUP_PRESET_IDS.map((preset) => (
                  <SetCard
                    key={preset}
                    title={FORMULA_PRESET_LABELS[preset]}
                    hint="Разминка"
                    defaultHold={false}
                    sets={formulas.warmups.static[preset]}
                    exampleMax={exampleMax}
                    exampleStep={exampleStep}
                    allowEmpty
                    onChange={(sets) => {
                      setSaved(false);
                      setFormulas((current) =>
                        current
                          ? patchWarmup(current, "static", preset, sets)
                          : current,
                      );
                    }}
                  />
                ))}
                {PHASE_TYPES.map((phase) => (
                  <SetCard
                    key={phase}
                    title={PHASE_TYPE_LABELS[phase]}
                    hint={phaseWorkHint(phase, exampleMax, raisedMax)}
                    defaultHold
                    sets={formulas.static[phase].work}
                    exampleMax={previewMaxForPhase(
                      phase,
                      exampleMax,
                      increasePercent,
                      exampleStep,
                    )}
                    exampleStep={exampleStep}
                    onChange={(work) => {
                      setSaved(false);
                      setFormulas((current) =>
                        current
                          ? patchPhaseWork(current, "static", phase, work)
                          : current,
                      );
                    }}
                  />
                ))}
              </>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Сохранено. Следующая тренировка пойдёт по этой схеме.
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

function SetCard({
  title,
  hint,
  defaultHold,
  sets,
  exampleMax,
  exampleStep,
  allowEmpty = false,
  onChange,
}: {
  title: string;
  hint: string;
  defaultHold: boolean;
  sets: FormulaSetSpec[];
  exampleMax: number;
  exampleStep: number;
  allowEmpty?: boolean;
  onChange: (sets: FormulaSetSpec[]) => void;
}) {
  function updateAt(index: number, patch: Partial<FormulaSetSpec>) {
    onChange(
      sets.map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set,
      ),
    );
  }

  function addSet() {
    if (sets.length >= MAX_SETS) {
      return;
    }
    const last = sets[sets.length - 1];
    onChange([
      ...sets,
      last
        ? { ...last }
        : defaultHold
          ? { percent: 100, reps: null, seconds: 6 }
          : { percent: 80, reps: 5, seconds: null },
    ]);
  }

  function removeAt(index: number) {
    if (!allowEmpty && sets.length <= 1) {
      return;
    }
    onChange(sets.filter((_, setIndex) => setIndex !== index));
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      {sets.length === 0 ? (
        <p className="text-base text-muted-foreground">Пусто</p>
      ) : null}

      {/* Sets have no stable id; the list is short and not reordered by drag. */}
      {sets.map((set, index) => {
        const hold = setUsesHold(set);
        const count = hold ? set.seconds : set.reps;
        const weight =
          exampleMax > 0
            ? calcPlannedWeight(exampleMax, set.percent, exampleStep)
            : null;
        const canRemove = allowEmpty || sets.length > 1;

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: identical work sets share values
            key={index}
            className="flex flex-col gap-2 rounded-xl bg-muted/50 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Подход {index + 1}
              </p>
              <RemoveRowButton
                label={`Убрать подход ${index + 1}`}
                disabled={!canRemove}
                onClick={() => removeAt(index)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                inputMode="decimal"
                value={String(set.percent)}
                onChange={(event) => {
                  const percent = parseDecimal(event.target.value);
                  if (percent == null || percent < 0) {
                    return;
                  }
                  updateAt(index, { percent });
                }}
                className="h-12 w-20 text-base"
                aria-label={`Процент, подход ${index + 1}`}
              />
              <span className="text-base text-muted-foreground">%</span>
              <span className="text-base text-muted-foreground">×</span>
              <Input
                inputMode={hold ? "decimal" : "numeric"}
                value={count == null ? "" : String(count)}
                onChange={(event) => {
                  const next = parseDecimal(event.target.value);
                  if (next == null || next <= 0) {
                    return;
                  }
                  if (hold) {
                    updateAt(index, { seconds: next, reps: null });
                    return;
                  }
                  if (!Number.isInteger(next)) {
                    return;
                  }
                  updateAt(index, { reps: next, seconds: null });
                }}
                className="h-12 w-20 text-base"
                aria-label={
                  hold
                    ? `Секунды, подход ${index + 1}`
                    : `Повторы, подход ${index + 1}`
                }
              />
              <div className="flex rounded-xl bg-background p-1">
                <button
                  type="button"
                  className={cn(
                    "h-10 rounded-lg px-3 text-sm",
                    hold
                      ? "text-muted-foreground"
                      : "bg-muted font-medium text-foreground",
                  )}
                  onClick={() => {
                    const next = set.seconds ?? set.reps ?? 5;
                    updateAt(index, {
                      reps: Number.isInteger(next) ? next : Math.round(next),
                      seconds: null,
                    });
                  }}
                >
                  повт
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-10 rounded-lg px-3 text-sm",
                    hold
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => {
                    updateAt(index, {
                      seconds: set.seconds ?? set.reps ?? 2,
                      reps: null,
                    });
                  }}
                >
                  сек
                </button>
              </div>
              <p className="min-w-0 flex-1 text-right text-base font-medium tabular-nums">
                {weight == null ? "—" : `${formatWeight(weight)} кг`}
              </p>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={sets.length >= MAX_SETS}
        onClick={addSet}
      >
        <Plus className="size-4" />
        Подход
      </Button>
    </section>
  );
}

function phaseWorkHint(
  phase: PhaseType,
  exampleMax: number,
  raisedMax: number,
): string {
  const raised =
    exampleMax > 0 && raisedMax > 0 && raisedMax !== exampleMax
      ? ` · от ${formatWeight(raisedMax)} кг`
      : "";
  if (phase === "deload") {
    return `Рабочие, без разминки${raised}`;
  }
  if (phase === "peak") {
    return `Рабочие${raised}`;
  }
  return "Рабочие";
}

function patchPhaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phase: PhaseType,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  return {
    ...formulas,
    [kind]: {
      ...formulas[kind],
      [phase]: { ...formulas[kind][phase], work },
    },
  };
}

function patchWarmup(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  preset: WarmupPresetId,
  sets: FormulaSetSpec[],
): WorkoutFormulas {
  return {
    ...formulas,
    warmups: {
      ...formulas.warmups,
      [kind]: {
        ...formulas.warmups[kind],
        [preset]: sets,
      },
    },
  };
}

function toPayload(maxIncreaseRaw: string, formulas: WorkoutFormulas) {
  const max_increase_percent = parseDecimal(maxIncreaseRaw);
  if (max_increase_percent == null || max_increase_percent < 0) {
    return null;
  }

  for (const phase of PHASE_TYPES) {
    if (formulas.dynamic[phase].work.length < 1) {
      return null;
    }
    if (formulas.static[phase].work.length < 1) {
      return null;
    }
    if (!setsOk(formulas.dynamic[phase].work)) {
      return null;
    }
    if (!setsOk(formulas.static[phase].work)) {
      return null;
    }
  }

  for (const kind of ["dynamic", "static"] as const) {
    for (const preset of WARMUP_PRESET_IDS) {
      if (!setsOk(formulas.warmups[kind][preset])) {
        return null;
      }
    }
  }

  return {
    max_increase_percent,
    formulas,
  };
}

function setsOk(sets: FormulaSetSpec[]): boolean {
  return sets.every((set) => {
    if (!(set.percent >= 0) || !Number.isFinite(set.percent)) {
      return false;
    }
    const hasReps = set.reps != null && set.reps > 0;
    const hasSeconds = set.seconds != null && set.seconds > 0;
    return hasReps !== hasSeconds;
  });
}

function readSettings(data: unknown): WorkoutSettings | null {
  return readWorkoutSettingsPayload(data);
}
