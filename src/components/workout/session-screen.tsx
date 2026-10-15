"use client";

import { useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenLoading } from "@/components/layout/screen-status";
import { SheetFrame } from "@/components/layout/sheet-frame";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { RestBar } from "@/components/workout/rest-bar";
import { SessionAddExercise } from "@/components/workout/session-add-exercise";
import { SessionCompletedPanel } from "@/components/workout/session-completed-panel";
import {
  loggedSetPatch,
  plannedLogPatch,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { SessionExerciseList } from "@/components/workout/session-exercise-list";
import { SessionMissingMaxes } from "@/components/workout/session-missing-maxes";
import { SessionMissingTracks } from "@/components/workout/session-missing-tracks";
import { SessionNoteField } from "@/components/workout/session-note-field";
import { SessionSoreBanner } from "@/components/workout/session-sore-banner";
import { useRestTimer } from "@/components/workout/use-rest-timer";
import { useSessionScreen } from "@/components/workout/use-session-screen";
import { postJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { SKIP_SESSION_LABEL } from "@/lib/flavor";
import { LOAD_FAILED } from "@/lib/messages";
import { heaviestWorkLift } from "@/lib/share/joy";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { sessionClosedCircle, sessionDetailBeat } from "@/lib/workout/beats";
import { upcomingWorkLine } from "@/lib/workout/next-load";
import { restLoadTargetKg } from "@/lib/workout/rest-load";
import { formatRestClock, workSetsNeedRest } from "@/lib/workout/rest-timer";
import {
  forgetPair,
  nextFocusSetId,
  pairWith,
  pruneSessionPairs,
  readSessionPairs,
  writeSessionPairs,
} from "@/lib/workout/session-pairs";
import { canShortenSession } from "@/lib/workout/session-short";
import { rememberTemplateSwap } from "@/lib/workout/template-cache-swap";

export function SessionScreen() {
  const confirm = useConfirm();
  const {
    loading,
    error,
    detail,
    load,
    session,
    title,
    subtitle,
    showStickyComplete,
    canEditSets,
    busy,
    note,
    setNote,
    saveNote,
    complete,
    saveFeel,
    raiseMaxes,
    cancelToday,
    correcting,
    setCorrecting,
    abovePlan,
    nextName,
    phaseHint,
    holdHint,
    completedSessions,
    lastCompletedBefore,
    phaseCircle,
    phaseId,
    easeWeek,
    easeWeekNow,
    openSetIds,
    setOpenSetIds,
    warmupOpen,
    setWarmupOpen,
    drafts,
    setDrafts,
    removeExercise,
    reorderExercises,
    saveMissingMaxes,
    saveMissingTracks,
    markSet,
    addExercise,
    addWorkSet,
    dropWorkSet,
    swapExercise,
    easeSession,
    shortenSession,
  } = useSessionScreen();
  const marking = useRef(new Set<string>());
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [templateOffer, setTemplateOffer] = useState<{
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  } | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  useEffect(() => {
    if (!session?.id) {
      return;
    }
    setPairs(readSessionPairs(session.id));
  }, [session?.id]);

  useEffect(() => {
    if (!session?.id || !detail?.exercises.length) {
      return;
    }
    const ids = new Set(detail.exercises.map((item) => item.id));
    setPairs((current) => {
      const pruned = pruneSessionPairs(current, ids);
      if (JSON.stringify(pruned) === JSON.stringify(current)) {
        return current;
      }
      writeSessionPairs(session.id, pruned);
      return pruned;
    });
  }, [session?.id, detail?.exercises]);
  const rest = useRestTimer(session?.id ?? null, session?.status === "planned");
  const canRest = session?.status === "planned" && !busy;
  const focusExerciseId = detail
    ? (restExerciseFor(detail, openSetIds) ?? rest.exerciseId)
    : rest.exerciseId;
  const loadTarget = restLoadTargetKg(
    detail?.exercises ?? [],
    focusExerciseId,
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={title} subtitle={subtitle} backHref="/workouts" />

      <div
        className={
          showStickyComplete && rest.left != null && rest.left > 0
            ? "flex flex-col gap-5 px-4 pb-80"
            : showStickyComplete && rest.left != null
              ? "flex flex-col gap-5 px-4 pb-40"
              : showStickyComplete
                ? "flex flex-col gap-5 px-4 pb-24"
                : "flex flex-col gap-5 px-4 pb-4"
        }
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !detail ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && session && detail ? (
          <>
            {session.status === "planned" ? (
              <div className="flex flex-col gap-2">
                <SessionSoreBanner
                  sessionId={session.id}
                  disabled={busy}
                  onEase={easeSession}
                />
                {canShortenSession(detail.exercises) ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 self-start"
                    disabled={busy}
                    onClick={() => {
                      void (async () => {
                        const ok = await confirm({
                          message:
                            "Оставить по два рабочих подхода и связать соседние упражнения?",
                          confirmLabel: "Ужать",
                          cancelLabel: "Оставить",
                        });
                        if (!ok) {
                          return;
                        }
                        const nextPairs = await shortenSession();
                        if (
                          !nextPairs ||
                          nextPairs.length === 0 ||
                          !session.id
                        ) {
                          return;
                        }
                        const stored = nextPairs.reduce(
                          (current, [left, right]) =>
                            pairWith(current, left, right),
                          {} as Record<string, string>,
                        );
                        writeSessionPairs(session.id, stored);
                        setPairs(stored);
                      })();
                    }}
                  >
                    Мало времени
                  </Button>
                ) : null}
              </div>
            ) : null}
            <SessionExerciseList
              detail={detail}
              busy={busy}
              canEditSets={canEditSets}
              canRest={canRest}
              restActive={rest.left != null}
              openSetIds={openSetIds}
              warmupOpen={warmupOpen}
              drafts={drafts}
              setOpenSetIds={setOpenSetIds}
              setWarmupOpen={setWarmupOpen}
              setDrafts={setDrafts}
              onRemove={(id) => void removeExercise(id)}
              onSwap={swapExercise}
              onOfferTemplate={setTemplateOffer}
              onReorder={
                canEditSets ? (ids) => void reorderExercises(ids) : undefined
              }
              onStartRest={canRest ? (id) => rest.start(id) : undefined}
              onToggleSet={(set, exerciseId) => {
                const row = detail.exercises.find(
                  (item) => item.exercise_id === exerciseId,
                );
                void toggleSet({
                  set,
                  exerciseId,
                  sessionExerciseId: row?.id ?? "",
                  draft: drafts[set.id],
                  pairs,
                  exercises: detail.exercises,
                  marking,
                  markSet,
                  openEditor: (id) => setOpenSetIds([id]),
                  focusSet: (id) => setOpenSetIds([id]),
                  startRest: (id) => rest.start(id),
                });
              }}
              onLogSet={(set, sessionExerciseId, draft) => {
                const row = detail.exercises.find(
                  (item) => item.id === sessionExerciseId,
                );
                void toggleSet({
                  set,
                  exerciseId: row?.exercise_id ?? "",
                  sessionExerciseId,
                  draft,
                  pairs,
                  exercises: detail.exercises,
                  marking,
                  markSet,
                  openEditor: (id) => setOpenSetIds([id]),
                  focusSet: (id) => setOpenSetIds([id]),
                  startRest: (id) => rest.start(row?.exercise_id ?? id),
                });
              }}
              onLogPlan={(sessionExerciseId) => {
                void logPlannedSets({
                  sessionExerciseId,
                  exercises: detail.exercises,
                  markSet,
                  startRest: (id) => rest.start(id),
                });
              }}
              pairs={pairs}
              onDropSet={
                session.status === "planned"
                  ? async (setId) => {
                      const ok = await dropWorkSet(setId);
                      if (ok) {
                        setOpenSetIds((current) =>
                          current.filter((id) => id !== setId),
                        );
                      }
                    }
                  : undefined
              }
              onAddSet={
                session.status === "planned"
                  ? async (sessionExerciseId) => {
                      const setId = await addWorkSet(sessionExerciseId);
                      if (setId) {
                        setOpenSetIds([setId]);
                      }
                    }
                  : undefined
              }
              onPair={(leftId, rightId) => {
                if (!session.id) {
                  return;
                }
                setPairs((current) => {
                  const next =
                    current[leftId] === rightId
                      ? forgetPair(current, leftId)
                      : pairWith(current, leftId, rightId);
                  writeSessionPairs(session.id, next);
                  return next;
                });
              }}
              lastRestSeconds={(id) => rest.lastSeconds(id)}
            />

            {session.status === "planned" ? (
              <SessionAddExercise
                takenIds={detail.exercises.map((item) => item.exercise_id)}
                disabled={busy}
                onAdd={addExercise}
              />
            ) : null}

            {session.status === "planned" && detail.missing_maxes.length > 0 ? (
              <SessionMissingMaxes
                exercises={detail.missing_maxes}
                busy={busy}
                onSave={saveMissingMaxes}
              />
            ) : null}

            {session.status === "planned" &&
            detail.missing_tracks.length > 0 ? (
              <SessionMissingTracks
                exercises={detail.missing_tracks}
                busy={busy}
                onSave={saveMissingTracks}
              />
            ) : null}

            {session.status === "planned" ||
            (session.status === "completed" && correcting) ||
            note.trim() !== "" ? (
              <SessionNoteField
                note={note}
                busy={busy}
                canEditSets={canEditSets}
                onChange={setNote}
                onSave={() => void saveNote()}
              />
            ) : null}

            {error ? (
              <p className="text-base leading-snug text-destructive">{error}</p>
            ) : null}

            {session.status === "completed" && !correcting ? (
              <SessionCompletedPanel
                abovePlan={abovePlan}
                nextName={nextName}
                phaseHint={phaseHint}
                holdHint={holdHint}
                feel={session.feel}
                inCycle={Boolean(session.phase_id)}
                raiseOffers={detail.raise_offers}
                completedSessions={completedSessions}
                lastCompletedBefore={lastCompletedBefore}
                sessionDate={session.session_date}
                phaseCircle={phaseCircle}
                beat={sessionDetailBeat(detail)}
                circleOpen={sessionClosedCircle({
                  sessionDate: session.session_date,
                  today: calendarToday(),
                  sessionPhaseId: session.phase_id,
                  currentPhaseId: phaseId,
                  openedItself: phaseCircle?.opened_itself === true,
                })}
                phaseId={phaseId}
                workLift={heaviestWorkLift(detail.exercises)}
                busy={busy}
                onCorrect={() => setCorrecting(true)}
                onFeel={(feel) => void saveFeel(feel)}
                onRaise={() => raiseMaxes()}
                easeWeek={easeWeek}
                onEase={() => easeWeekNow()}
                sessionExercises={detail.exercises}
              />
            ) : null}

            {session.status === "planned" || session.status === "skipped" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void cancelToday()}
              >
                {busy ? "Убираю…" : SKIP_SESSION_LABEL}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <StickyActions className="[&>div]:gap-4">
          {rest.left != null ? (
            <div data-keyboard-secondary>
              <RestBar
                away={rest.finishedAway}
                left={rest.left}
                targetKg={loadTarget}
                nextLine={upcomingWorkLine(
                  detail.exercises.map((item) => ({
                    name: item.exercise.short_name || item.exercise.name,
                    sets: item.sets,
                  })),
                  openSetIds,
                )}
                round={rest.round}
                onAdd={rest.add}
                onSubtract={rest.subtract}
                onStop={rest.stop}
                onRestart={rest.restart}
              />
            </div>
          ) : null}
          {canRest && rest.left == null && focusExerciseId ? (
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full text-base"
              onClick={() => rest.start(focusExerciseId)}
            >
              Отдых {formatRestClock(rest.lastSeconds(focusExerciseId))}
            </Button>
          ) : null}
          <Button
            type="button"
            className="mt-2 h-14 w-full text-lg"
            disabled={busy || detail.exercises.length === 0}
            onClick={() => {
              void (async () => {
                rest.stop();
                if (detail.session.status === "planned") {
                  const ok = await confirm({
                    message: "Закрыть тренировку?",
                    confirmLabel: "Готово",
                    cancelLabel: "Ещё правлю",
                  });
                  if (!ok) {
                    return;
                  }
                }
                await complete();
              })();
            }}
          >
            {busy
              ? "Сохраняю…"
              : detail.session.status === "planned"
                ? "Готово"
                : "Сохранить"}
          </Button>
        </StickyActions>
      ) : null}
      {templateOffer && session ? (
        <SheetFrame
          title="Замена в программе"
          onCancel={() => {
            if (!savingTemplate) {
              setTemplateOffer(null);
              setTemplateError(null);
            }
          }}
        >
          <p className="text-base leading-snug">
            Сегодня стоит {templateOffer.name}.
          </p>
          {templateError ? (
            <p className="text-base text-destructive">{templateError}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={savingTemplate}
            onClick={() => {
              setTemplateOffer(null);
              setTemplateError(null);
            }}
          >
            Только на сегодня
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={savingTemplate}
            onClick={() => {
              void (async () => {
                setSavingTemplate(true);
                setTemplateError(null);
                try {
                  await postJson(`/api/sessions/${session.id}/template-swap`, {
                    fromExerciseId: templateOffer.fromExerciseId,
                    exerciseId: templateOffer.exerciseId,
                  });
                  if (session.template_id) {
                    rememberTemplateSwap({
                      templateId: session.template_id,
                      date: session.session_date,
                      fromExerciseId: templateOffer.fromExerciseId,
                      exerciseId: templateOffer.exerciseId,
                    });
                  }
                  haptic("commit");
                  setTemplateOffer(null);
                } catch (caught) {
                  haptic("error");
                  setTemplateError(
                    caught instanceof Error ? caught.message : LOAD_FAILED,
                  );
                } finally {
                  setSavingTemplate(false);
                }
              })();
            }}
          >
            {savingTemplate ? "Сохраняю…" : "Заменить и в шаблоне"}
          </Button>
        </SheetFrame>
      ) : null}
    </div>
  );
}

async function toggleSet({
  set,
  exerciseId,
  sessionExerciseId,
  draft,
  pairs,
  exercises,
  marking,
  markSet,
  openEditor,
  focusSet,
  startRest,
}: {
  set: WorkoutSet;
  exerciseId: string;
  sessionExerciseId: string;
  draft: SetDraft | undefined;
  pairs: Record<string, string>;
  exercises: SessionDetail["exercises"];
  marking: { current: Set<string> };
  markSet: (
    setId: string,
    patch: {
      is_completed: boolean;
      actual_weight?: number | null;
      actual_reps?: number | null;
      actual_seconds?: number | null;
      actual_rir?: number | null;
    },
  ) => Promise<boolean>;
  openEditor: (setId: string) => void;
  focusSet: (setId: string) => void;
  startRest: (exerciseId: string) => void;
}) {
  if (marking.current.has(set.id)) {
    return;
  }
  if (!set.is_completed) {
    const patch = loggedSetPatch(set, draft);
    if (!patch) {
      haptic("warn");
      openEditor(set.id);
      return;
    }
    marking.current.add(set.id);
    try {
      const ok = await markSet(set.id, { is_completed: true, ...patch });
      if (ok && set.set_type === "work") {
        const nextId = nextFocusSetId(
          exercises,
          sessionExerciseId,
          set.id,
          pairs[sessionExerciseId] ?? null,
        );
        if (nextId) {
          focusSet(nextId);
        }
        const restExerciseId =
          exerciseIdForSet(exercises, nextId) ?? exerciseId;
        startRest(restExerciseId);
      }
    } finally {
      marking.current.delete(set.id);
    }
    return;
  }

  marking.current.add(set.id);
  try {
    await markSet(set.id, { is_completed: false });
  } finally {
    marking.current.delete(set.id);
  }
}

async function logPlannedSets({
  sessionExerciseId,
  exercises,
  markSet,
  startRest,
}: {
  sessionExerciseId: string;
  exercises: SessionDetail["exercises"];
  markSet: (
    setId: string,
    patch: {
      is_completed: boolean;
      actual_weight?: number | null;
      actual_reps?: number | null;
      actual_seconds?: number | null;
      actual_rir?: number | null;
    },
  ) => Promise<boolean>;
  startRest: (exerciseId: string) => void;
}) {
  const item = exercises.find((row) => row.id === sessionExerciseId);
  if (!item) {
    return;
  }
  let logged = false;
  for (const set of item.sets) {
    if (set.set_type !== "work" || set.is_completed) {
      continue;
    }
    const patch = plannedLogPatch(set);
    if (!patch) {
      continue;
    }
    const ok = await markSet(set.id, { is_completed: true, ...patch });
    if (!ok) {
      return;
    }
    logged = true;
  }
  if (logged) {
    startRest(item.exercise_id);
  }
}

function exerciseIdForSet(
  exercises: SessionDetail["exercises"],
  setId: string | null,
): string | null {
  if (!setId) {
    return null;
  }
  for (const item of exercises) {
    if (item.sets.some((row) => row.id === setId)) {
      return item.exercise_id;
    }
  }
  return null;
}

function restExerciseFor(
  detail: SessionDetail,
  openSetIds: string[],
): string | null {
  for (const item of detail.exercises) {
    if (item.sets.some((set) => openSetIds.includes(set.id))) {
      return item.exercise_id;
    }
  }
  for (const item of detail.exercises) {
    const work = item.sets.filter((set) => set.set_type === "work");
    if (workSetsNeedRest(work)) {
      return item.exercise_id;
    }
  }
  return null;
}
