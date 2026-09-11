"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacroRecapCard } from "@/components/workout/macro-recap-card";
import { cachedGet, mutateJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { CurrentMacroState, TransitionPreview } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import {
  completePhaseHint,
  phaseEndHint,
  phaseLinkLabel,
  transitionExplain,
} from "@/lib/workout/hints";
import { parseCurrentMacroState } from "@/lib/workout/hub-payload";
import { CYCLE_LABEL, phaseLabel } from "@/lib/workout/labels";
import { parseTransitionPreview } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function MacroScreen() {
  const [state, setState] = useState<CurrentMacroState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TransitionPreview | null>(null);
  const [transitionDate, setTransitionDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [transitionMaxes, setTransitionMaxes] = useState<
    Record<string, string>
  >({});
  const [transitioning, setTransitioning] = useState(false);
  const [justClosed, setJustClosed] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        "/api/macros",
        (data) => {
          const next = readState(data);
          if (!next) {
            return false;
          }
          setState(next);
          setDrafts(
            Object.fromEntries(
              (next.maxes ?? []).map((row) => [
                row.exercise.id,
                row.phase_max ? formatWeight(row.phase_max.max_weight) : "",
              ]),
            ),
          );
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setState(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveMax(exerciseId: string) {
    if (!state?.phase) {
      return;
    }

    const weight = parseDecimal(drafts[exerciseId] ?? "");
    if (weight == null || weight <= 0) {
      haptic("warn");
      setError("Проверь рабочий вес.");
      return;
    }

    setSavingId(exerciseId);
    setError(null);

    try {
      await postJson(`/api/phases/${state.phase.id}/maxes`, {
        exercise_id: exerciseId,
        max_weight: weight,
      });
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSavingId(null);
    }
  }

  async function openTransition() {
    setError(null);
    setTransitioning(true);

    try {
      const data = await mutateJson("/api/macros/transition");
      const next = readPreview(data);
      if (!next) {
        haptic("error");
        setError(LOAD_FAILED);
        return;
      }

      setPreview(next);
      setTransitionDate(format(new Date(), "yyyy-MM-dd"));
      setTransitionMaxes(
        Object.fromEntries(
          next.maxes.map((row) => [
            row.exercise_id,
            formatWeight(row.proposed_weight),
          ]),
        ),
      );
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setTransitioning(false);
    }
  }

  async function confirmTransition() {
    const maxes = (preview?.maxes ?? []).flatMap((row) => {
      const weight = parseDecimal(transitionMaxes[row.exercise_id] ?? "");
      if (weight == null || weight <= 0) {
        return [];
      }
      return [{ exercise_id: row.exercise_id, max_weight: weight }];
    });

    if (!preview || maxes.length !== preview.maxes.length) {
      haptic("warn");
      setError("Проверь предложенные рабочие веса.");
      return;
    }

    const closingMacro = preview.new_macro;
    setTransitioning(true);
    setError(null);

    try {
      await postJson("/api/macros/transition", {
        end_date: transitionDate,
        maxes,
      });
      setPreview(null);
      setJustClosed(closingMacro);
      haptic("success");
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={CYCLE_LABEL}
        subtitle="То легче, то тяжелее"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !state ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && state && !state.macro ? (
          <>
            {state.last_recap ? (
              <MacroRecapCard
                key={state.last_recap.macro_id}
                recap={state.last_recap}
                featured={justClosed}
              />
            ) : null}
            <section className="card-surface flex flex-col gap-3 px-5 py-5">
              <p className="text-lg font-medium">Цикла ещё нет</p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Тренировки те же, просто легче или тяжелее. Этап закрываешь сам.
              </p>
              <Link
                href="/workouts/macro/new"
                className={cn(buttonVariants(), "h-14 text-lg")}
              >
                Создать цикл
              </Link>
            </section>
          </>
        ) : null}

        {!loading && state?.macro && state.phase ? (
          <>
            {state.last_recap ? (
              <MacroRecapCard
                key={state.last_recap.macro_id}
                recap={state.last_recap}
                featured={justClosed}
              />
            ) : null}
            <section className="card-surface flex flex-col gap-2 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                Цикл{" "}
                {phaseLinkLabel(
                  state.macro.number,
                  state.phase_circle,
                  state.phase.phase_type,
                  state.phase.name,
                )}
              </p>
              <h2 className="text-2xl font-semibold">
                {phaseLabel(state.phase.phase_type, state.phase.name)}
              </h2>
              <p className="text-sm text-muted-foreground">
                С {state.phase.start_date}. Этап закрываешь кнопкой ниже.
              </p>
              {state.phase_circle && phaseEndHint(state.phase_circle) ? (
                <p className="text-base leading-snug">
                  {phaseEndHint(state.phase_circle)}
                </p>
              ) : null}
              <ol className="mt-2 flex flex-wrap gap-2">
                {state.phases.map((phase) => (
                  <li
                    key={phase.id}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm",
                      phase.status === "current"
                        ? "bg-primary/12 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {phaseLabel(phase.phase_type, phase.name)}
                  </li>
                ))}
              </ol>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Веса этого этапа</h2>
              <p className="text-sm text-muted-foreground">
                От этих цифр считается план. Только упражнения, которые делаешь.
                Остальные — «Не делаю» в списке упражнений.
              </p>
              {state.maxes.map((row) => (
                <div
                  key={row.exercise.id}
                  className="card-surface flex flex-col gap-3 px-5 py-4"
                >
                  <p className="text-lg font-medium">
                    {row.exercise.short_name || row.exercise.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Рекорд{" "}
                    {row.exercise.current_max
                      ? `${formatWeight(row.exercise.current_max.max_weight)} кг`
                      : "—"}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      inputMode="decimal"
                      value={drafts[row.exercise.id] ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.exercise.id]: event.target.value,
                        }))
                      }
                      className="h-12 text-base"
                    />
                    <Button
                      type="button"
                      className="h-12 px-4 text-base"
                      disabled={savingId === row.exercise.id}
                      onClick={() => void saveMax(row.exercise.id)}
                    >
                      {savingId === row.exercise.id ? "…" : "Сохранить"}
                    </Button>
                  </div>
                </div>
              ))}
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {preview ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-5">
                <h2 className="text-xl font-semibold">
                  {preview.new_macro
                    ? "Новый цикл"
                    : `Дальше: ${preview.to_name ?? (preview.to_phase ? phaseLabel(preview.to_phase) : "")}`}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {transitionExplain(preview)}
                </p>
                <Input
                  type="date"
                  value={transitionDate}
                  onChange={(event) => setTransitionDate(event.target.value)}
                  className="h-12 text-base"
                />
                {preview.maxes.map((row) => (
                  <div key={row.exercise_id} className="flex flex-col gap-1">
                    <p className="text-base font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">
                      сейчас {formatWeight(row.current_weight)} → будет{" "}
                      {formatWeight(row.proposed_weight)}
                    </p>
                    <Input
                      inputMode="decimal"
                      value={transitionMaxes[row.exercise_id] ?? ""}
                      onChange={(event) =>
                        setTransitionMaxes((current) => ({
                          ...current,
                          [row.exercise_id]: event.target.value,
                        }))
                      }
                      className="h-12 text-base"
                    />
                  </div>
                ))}
                <StickyActions>
                  <Button
                    type="button"
                    className="h-14 text-lg"
                    disabled={transitioning}
                    onClick={() => void confirmTransition()}
                  >
                    {transitioning ? "Сохранение…" : "Подтвердить"}
                  </Button>
                </StickyActions>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 text-base"
                  disabled={transitioning}
                  onClick={() => setPreview(null)}
                >
                  Отмена
                </Button>
              </section>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {completePhaseHint(state.phase_circle)}
                </p>
                <StickyActions>
                  <Button
                    type="button"
                    className="h-14 text-lg"
                    disabled={transitioning}
                    onClick={() => void openTransition()}
                  >
                    {state.phase_circle?.last_in_cycle
                      ? "Закрыть цикл"
                      : `Завершить: ${phaseLabel(state.phase.phase_type, state.phase.name)}`}
                  </Button>
                </StickyActions>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function readState(data: unknown): CurrentMacroState | null {
  return parseCurrentMacroState(data);
}

function readPreview(data: unknown): TransitionPreview | null {
  return parseTransitionPreview(data);
}
