"use client";

import { useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { SessionAddExercise } from "@/components/workout/session-add-exercise";
import { SessionCompletedPanel } from "@/components/workout/session-completed-panel";
import { SessionExerciseList } from "@/components/workout/session-exercise-list";
import { SessionMissingMaxes } from "@/components/workout/session-missing-maxes";
import { SessionMissingTracks } from "@/components/workout/session-missing-tracks";
import { SessionNoteField } from "@/components/workout/session-note-field";
import { SessionScreenPlannedTools } from "@/components/workout/session-screen-planned-tools";
import { SessionScreenStickyFooter } from "@/components/workout/session-screen-sticky-footer";
import { SessionTemplateSwapSheet } from "@/components/workout/session-template-swap-sheet";
import { useRestTimer } from "@/components/workout/use-rest-timer";
import { useSessionScreen } from "@/components/workout/use-session-screen";
import { calendarToday } from "@/lib/day/dates";
import { SKIP_SESSION_LABEL } from "@/lib/flavor";
import { heaviestWorkLift } from "@/lib/share/joy";
import { sessionClosedCircle, sessionDetailBeat } from "@/lib/workout/beats";
import { restLoadTargetKg } from "@/lib/workout/rest-load";
import {
  forgetPair,
  pairWith,
  pruneSessionPairs,
  readSessionPairs,
  writeSessionPairs,
} from "@/lib/workout/session-pairs";
import { sessionScreenContentPadding } from "@/lib/workout/session-screen-view";
import {
  logPlannedSessionSets,
  restExerciseFor,
  toggleSessionSet,
} from "@/lib/workout/session-set-interaction";

export function SessionScreen() {
  const screen = useSessionScreen();
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
  } = screen;

  const marking = useRef(new Set<string>());
  const loggingPlan = useRef(false);
  const closing = useRef(false);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [templateOffer, setTemplateOffer] = useState<{
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  } | null>(null);

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
  const loadTarget = restLoadTargetKg(detail?.exercises ?? [], focusExerciseId);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={title} subtitle={subtitle} backHref="/workouts" />

      <div
        className={sessionScreenContentPadding(showStickyComplete, rest.left)}
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
            <SessionScreenPlannedTools
              sessionId={session.id}
              detail={detail}
              busy={busy}
              onEase={easeSession}
              onShorten={shortenSession}
              onPairsApplied={setPairs}
            />

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

            <SessionExerciseList
              detail={detail}
              busy={busy}
              canEditSets={canEditSets}
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
              onToggleSet={(set, exerciseId) => {
                const row = detail.exercises.find(
                  (item) => item.exercise_id === exerciseId,
                );
                void toggleSessionSet({
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
                if (session.status === "completed" && correcting) {
                  setDrafts((current) => ({ ...current, [set.id]: draft }));
                  return;
                }
                const row = detail.exercises.find(
                  (item) => item.id === sessionExerciseId,
                );
                void toggleSessionSet({
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
                if (loggingPlan.current) {
                  return;
                }
                loggingPlan.current = true;
                void logPlannedSessionSets({
                  sessionExerciseId,
                  exercises: detail.exercises,
                  markSet,
                  startRest: (id) => rest.start(id),
                }).finally(() => {
                  loggingPlan.current = false;
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
            />

            {session.status === "planned" ? (
              <SessionAddExercise
                takenIds={detail.exercises.map((item) => item.exercise_id)}
                disabled={busy}
                onAdd={addExercise}
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
        <SessionScreenStickyFooter
          detail={detail}
          busy={busy}
          openSetIds={openSetIds}
          restLeft={rest.left}
          restFinishedAway={rest.finishedAway}
          loadTarget={loadTarget}
          restRound={rest.round}
          canRest={canRest}
          focusExerciseId={focusExerciseId}
          lastRestSeconds={
            focusExerciseId ? rest.lastSeconds(focusExerciseId) : 0
          }
          onComplete={async () => {
            if (busy || closing.current) {
              return;
            }
            closing.current = true;
            try {
              await complete();
            } finally {
              closing.current = false;
            }
          }}
          onRestAdd={rest.add}
          onRestSubtract={rest.subtract}
          onRestStop={rest.stop}
          onRestRestart={rest.restart}
          onRestStart={(id) => rest.start(id)}
        />
      ) : null}

      {templateOffer && session ? (
        <SessionTemplateSwapSheet
          session={session}
          offer={templateOffer}
          onClose={() => setTemplateOffer(null)}
        />
      ) : null}
    </div>
  );
}
