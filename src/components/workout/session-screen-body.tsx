"use client";

import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { SessionAddExercise } from "@/components/workout/session-add-exercise";
import { SessionCompletedPanel } from "@/components/workout/session-completed-panel";
import { SessionExerciseList } from "@/components/workout/session-exercise-list";
import { SessionMissingMaxes } from "@/components/workout/session-missing-maxes";
import { SessionMissingTracks } from "@/components/workout/session-missing-tracks";
import { SessionNoteField } from "@/components/workout/session-note-field";
import { SessionScreenPlannedTools } from "@/components/workout/session-screen-planned-tools";
import { useSessionExerciseListHandlers } from "@/components/workout/use-session-exercise-list-handlers";
import type { SessionScreenModel } from "@/components/workout/use-session-screen";
import { calendarToday } from "@/lib/day/dates";
import { SKIP_SESSION_LABEL } from "@/lib/flavor";
import { heaviestWorkLift } from "@/lib/share/joy";
import type { SessionDetail, WorkoutSession } from "@/lib/types";
import { sessionClosedCircle, sessionDetailBeat } from "@/lib/workout/beats";

export function SessionScreenBody({
  screen,
  session,
  detail,
  pairs,
  setPairs,
  onOfferTemplate,
  startRest,
}: {
  screen: SessionScreenModel;
  session: WorkoutSession;
  detail: SessionDetail;
  pairs: Record<string, string>;
  setPairs: Dispatch<SetStateAction<Record<string, string>>>;
  onOfferTemplate: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
  startRest: (exerciseId: string) => void;
}) {
  const {
    busy,
    canEditSets,
    note,
    setNote,
    saveNote,
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
    error,
  } = screen;

  const listHandlers = useSessionExerciseListHandlers({
    session,
    detail,
    correcting,
    drafts,
    setDrafts,
    setOpenSetIds,
    pairs,
    setPairs,
    markSet,
    addWorkSet,
    dropWorkSet,
    startRest,
  });

  return (
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

      {session.status === "planned" && detail.missing_tracks.length > 0 ? (
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
        onOfferTemplate={onOfferTemplate}
        onReorder={
          canEditSets ? (ids) => void reorderExercises(ids) : undefined
        }
        pairs={pairs}
        onToggleSet={listHandlers.onToggleSet}
        onLogSet={listHandlers.onLogSet}
        onLogPlan={listHandlers.onLogPlan}
        onDropSet={listHandlers.onDropSet}
        onAddSet={listHandlers.onAddSet}
        onPair={listHandlers.onPair}
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
  );
}
