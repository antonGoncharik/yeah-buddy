"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  FormulaSetSpec,
  PhaseType,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
import { calcPlannedWeight, previewMaxForPhase } from "@/lib/workout/formulas";
import {
  FORMULA_PRESET_LABELS,
  PHASE_TYPE_LABELS,
  PHASE_TYPES,
  WARMUP_PRESET_IDS,
  WEIGHT_STEP_OPTIONS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
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
      setError("Проверьте проценты, подходы и повторы.");
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
      message: "Вернуть схему как в дневнике?",
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
        subtitle="Откуда берутся веса в зале"
        backHref="/settings"
      />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !formulas ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && formulas ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <h2 className="text-xl font-semibold">Как это работает</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Вес подхода — максимум упражнения × процент, вниз до шага
                блинов. Разминка общая: штанга или блок, как в карточке
                упражнения. Рабочие — свои на каждую фазу. Сетка одна на все
                движения: в зале вес подхода всегда можно поправить.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Плюс добавляет подход, минус убирает.
              </p>
            </section>

            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">На рывке</h2>
                <p className="text-sm text-muted-foreground">к максимуму</p>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                Когда набор заканчивается, максимумы поднимаются на этот
                процент. Рывок и сброс в примере ниже уже от нового веса.
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
                  aria-label="Прирост максимума на рывке"
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
                Подставь максимум разгона — справа в подходах появятся
                килограммы. Это черновик, в дневник не пишется.
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
                  aria-label="Пример максимума"
                />
                <span className="text-base text-muted-foreground">кг макс</span>
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
                  Разминка подставляется из упражнения (штанга или блок).
                  Рабочие зависят от фазы. В рывке разминка тоже от уже нового
                  максимума.
                </p>
                {WARMUP_PRESET_IDS.map((preset) => (
                  <SetCard
                    key={preset}
                    title={FORMULA_PRESET_LABELS[preset]}
                    hint="Разминка"
                    kind="dynamic"
                    sets={formulas.warmups[preset]}
                    exampleMax={exampleMax}
                    exampleStep={exampleStep}
                    allowEmpty
                    onChange={(sets) => {
                      setSaved(false);
                      setFormulas((current) =>
                        current
                          ? {
                              ...current,
                              warmups: { ...current.warmups, [preset]: sets },
                            }
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
                    kind="dynamic"
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
                  Здесь рабочие удержания в секундах. Разминка у упражнения та
                  же, в повторах. Сброс — без разминки.
                </p>
                {PHASE_TYPES.map((phase) => (
                  <SetCard
                    key={phase}
                    title={PHASE_TYPE_LABELS[phase]}
                    hint={phaseWorkHint(phase, exampleMax, raisedMax)}
                    kind="static"
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
                Сохранено. Следующая тренировка пойдёт уже по этой схеме.
              </p>
            ) : null}

            <Button
              type="button"
              className="h-14 text-lg"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 text-base"
              disabled={saving}
              onClick={() => void restoreDefaults()}
            >
              Как в дневнике
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SetCard({
  title,
  hint,
  kind,
  sets,
  exampleMax,
  exampleStep,
  allowEmpty = false,
  onChange,
}: {
  title: string;
  hint: string;
  kind: WorkoutKind;
  sets: FormulaSetSpec[];
  exampleMax: number;
  exampleStep: number;
  allowEmpty?: boolean;
  onChange: (sets: FormulaSetSpec[]) => void;
}) {
  const countLabel = kind === "static" ? "сек" : "повт";

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
        : kind === "static"
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
        const count = kind === "static" ? set.seconds : set.reps;
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
              <button
                type="button"
                className="flex h-10 items-center gap-1 rounded-xl px-2 text-sm text-muted-foreground transition-[background-color,transform] hover:bg-muted active:scale-95 disabled:opacity-30"
                aria-label={`Убрать подход ${index + 1}`}
                disabled={!canRemove}
                onClick={() => removeAt(index)}
              >
                <Minus className="size-4" />
                Убрать
              </button>
            </div>
            <div className="flex items-center gap-2">
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
                inputMode={kind === "static" ? "decimal" : "numeric"}
                value={count == null ? "" : String(count)}
                onChange={(event) => {
                  const next = parseDecimal(event.target.value);
                  if (next == null || next <= 0) {
                    return;
                  }
                  if (kind === "static") {
                    updateAt(index, { seconds: next, reps: null });
                    return;
                  }
                  if (!Number.isInteger(next)) {
                    return;
                  }
                  updateAt(index, { reps: next, seconds: null });
                }}
                className="h-12 w-20 text-base"
                aria-label={`${countLabel}, подход ${index + 1}`}
              />
              <span className="text-base text-muted-foreground">
                {countLabel}
              </span>
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
    if (!setsOk(formulas.dynamic[phase].work, "dynamic")) {
      return null;
    }
    if (!setsOk(formulas.static[phase].work, "static")) {
      return null;
    }
  }

  for (const preset of WARMUP_PRESET_IDS) {
    if (!setsOk(formulas.warmups[preset], "dynamic")) {
      return null;
    }
  }

  return {
    max_increase_percent,
    formulas: {
      ...formulas,
      static: {
        ramp: { warmup: [], work: formulas.static.ramp.work },
        volume: { warmup: [], work: formulas.static.volume.work },
        peak: { warmup: [], work: formulas.static.peak.work },
        deload: { warmup: [], work: formulas.static.deload.work },
      },
    },
  };
}

function setsOk(sets: FormulaSetSpec[], kind: WorkoutKind): boolean {
  return sets.every((set) => {
    if (!(set.percent >= 0) || !Number.isFinite(set.percent)) {
      return false;
    }
    if (kind === "static") {
      return set.seconds != null && set.seconds > 0;
    }
    return set.reps != null && set.reps > 0;
  });
}

function readSettings(data: unknown): WorkoutSettings | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("settings" in data) ||
    !data.settings ||
    typeof data.settings !== "object"
  ) {
    return null;
  }

  const settings = data.settings as Partial<WorkoutSettings>;
  if (
    settings.formulas == null ||
    settings.max_increase_percent == null ||
    settings.formulas.warmups == null
  ) {
    return null;
  }

  return settings as WorkoutSettings;
}
