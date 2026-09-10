"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
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
  CyclePhaseDef,
  FormulaSetSpec,
  WarmupPresetId,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import {
  addCyclePhase,
  applyWorkPattern,
  moveCyclePhase,
  patchCyclePhase,
  raisedMaxForPhase,
  removeCyclePhase,
  withCycle,
} from "@/lib/workout/cycle";
import {
  CYCLE_TEMPLATES,
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
  FORMULAS_LABEL,
  WARMUP_PRESET_IDS,
  WEIGHT_STEP_OPTIONS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const MAX_SETS = 8;
const MAX_PHASES = 8;
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
          const settings = readSettings(data);
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

            <section className="card-surface flex flex-col gap-3 px-5 py-4">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setCycleOpen((open) => !open)}
              >
                <div>
                  <h2 className="text-xl font-semibold">Этапы</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {formulas.cycle.length > 0
                      ? formulas.cycle.map((phase) => phase.name).join(" → ")
                      : "Разные недели — если надо."}
                  </p>
                </div>
                {cycleOpen ? (
                  <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                )}
              </button>

              {cycleOpen ? (
                <div className="flex flex-col gap-3">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Текущий цикл не меняется.
                  </p>
                  {formulas.cycle.length === 0 ? (
                    <>
                      {CYCLE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                          onClick={() =>
                            void applyCycleTemplate(
                              template.cycle,
                              template.name,
                            )
                          }
                        >
                          <p className="text-base font-medium">
                            {template.name}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {template.hint}
                          </p>
                        </button>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 text-base"
                        onClick={() => {
                          setFormulas((current) =>
                            current
                              ? addCyclePhase(current, "Этап 1")
                              : current,
                          );
                          setSaved(false);
                        }}
                      >
                        Свой цикл
                      </Button>
                    </>
                  ) : (
                    <>
                      {formulas.cycle.map((phase, index) => {
                        const spec = formulas[kind].phases[phase.key];
                        const work = spec?.work ?? formulas[kind].base.work;
                        const phaseMax = previewMaxForPhase(
                          formulas.cycle,
                          phase.key,
                          exampleMax,
                          increasePercent,
                          exampleStep,
                        );
                        return (
                          <div key={phase.key} className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <Input
                                value={phase.name}
                                onChange={(event) => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? patchCyclePhase(current, phase.key, {
                                          name: event.target.value.slice(0, 40),
                                        })
                                      : current,
                                  );
                                }}
                                className="h-12 flex-1 text-base"
                                aria-label="Название этапа"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-12 w-12 p-0"
                                disabled={index === 0}
                                aria-label="Выше"
                                onClick={() => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? moveCyclePhase(current, phase.key, -1)
                                      : current,
                                  );
                                }}
                              >
                                <ChevronUp className="size-5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-12 w-12 p-0"
                                disabled={index === formulas.cycle.length - 1}
                                aria-label="Ниже"
                                onClick={() => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? moveCyclePhase(current, phase.key, 1)
                                      : current,
                                  );
                                }}
                              >
                                <ChevronDown className="size-5" />
                              </Button>
                              <RemoveRowButton
                                label={`Убрать этап ${phase.name}`}
                                onClick={() => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? removeCyclePhase(current, phase.key)
                                      : current,
                                  );
                                }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <ToggleChip
                                on={phase.skip_warmup}
                                label="Без разминки"
                                onClick={() => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? patchCyclePhase(current, phase.key, {
                                          skip_warmup: !phase.skip_warmup,
                                        })
                                      : current,
                                  );
                                }}
                              />
                              <ToggleChip
                                on={phase.increase_on_end}
                                label="Поднять веса в конце"
                                onClick={() => {
                                  setSaved(false);
                                  setFormulas((current) =>
                                    current
                                      ? patchCyclePhase(current, phase.key, {
                                          increase_on_end:
                                            !phase.increase_on_end,
                                        })
                                      : current,
                                  );
                                }}
                              />
                            </div>
                            <SetCard
                              title={phase.name}
                              hint={phaseWorkHint(phase, exampleMax, phaseMax)}
                              defaultHold={kind === "static"}
                              sets={work}
                              exampleMax={phaseMax}
                              exampleStep={exampleStep}
                              onChange={(nextWork) => {
                                setSaved(false);
                                setFormulas((current) =>
                                  current
                                    ? patchPhaseWork(
                                        current,
                                        kind,
                                        phase.key,
                                        nextWork,
                                      )
                                    : current,
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-12 text-base"
                        disabled={formulas.cycle.length >= MAX_PHASES}
                        onClick={() => {
                          setSaved(false);
                          setFormulas((current) =>
                            current
                              ? addCyclePhase(
                                  current,
                                  `Этап ${current.cycle.length + 1}`,
                                )
                              : current,
                          );
                        }}
                      >
                        <Plus className="size-4" />
                        Этап
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 text-base"
                        onClick={() => void clearCycle()}
                      >
                        Убрать этапы
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </section>

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

function ToggleChip({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3 py-2 text-sm",
        on
          ? "bg-primary/12 font-medium text-primary"
          : "bg-muted text-muted-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
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
  phase: CyclePhaseDef,
  exampleMax: number,
  phaseMax: number,
): string {
  const raised =
    exampleMax > 0 && phaseMax > 0 && phaseMax !== exampleMax
      ? ` · от ${formatWeight(phaseMax)} кг`
      : "";
  if (phase.skip_warmup) {
    return `Рабочие, без разминки${raised}`;
  }
  return `Рабочие${raised}`;
}

function patchBaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  return {
    ...formulas,
    [kind]: {
      ...formulas[kind],
      base: { ...formulas[kind].base, work },
    },
  };
}

function patchPhaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  key: string,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  const current = formulas[kind].phases[key] ?? formulas[kind].base;
  return {
    ...formulas,
    [kind]: {
      ...formulas[kind],
      phases: {
        ...formulas[kind].phases,
        [key]: { ...current, work },
      },
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

  if (
    formulas.dynamic.base.work.length < 1 ||
    formulas.static.base.work.length < 1 ||
    !setsOk(formulas.dynamic.base.work) ||
    !setsOk(formulas.static.base.work)
  ) {
    return null;
  }

  for (const phase of formulas.cycle) {
    const dynamic = formulas.dynamic.phases[phase.key];
    const staticKind = formulas.static.phases[phase.key];
    if (
      !dynamic ||
      !staticKind ||
      dynamic.work.length < 1 ||
      staticKind.work.length < 1 ||
      !setsOk(dynamic.work) ||
      !setsOk(staticKind.work)
    ) {
      return null;
    }
    if (!phase.name.trim()) {
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
