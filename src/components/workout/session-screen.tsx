"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { RestBar } from "@/components/workout/rest-bar";
import { SessionCompletedPanel } from "@/components/workout/session-completed-panel";
import { SessionExerciseList } from "@/components/workout/session-exercise-list";
import { SessionMissingMaxes } from "@/components/workout/session-missing-maxes";
import { SessionMissingTracks } from "@/components/workout/session-missing-tracks";
import { SessionNoteField } from "@/components/workout/session-note-field";
import { useRestTimer } from "@/components/workout/use-rest-timer";
import { useSessionScreen } from "@/components/workout/use-session-screen";
import { SKIP_SESSION_LABEL } from "@/lib/flavor";
import { restLoadTargetKg } from "@/lib/workout/rest-load";

export function SessionScreen() {
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
  } = useSessionScreen();
  const rest = useRestTimer(session?.id ?? null, session?.status === "planned");
  const canRest = session?.status === "planned" && !busy;
  const loadTarget = restLoadTargetKg(detail?.exercises ?? [], rest.exerciseId);

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
              onReorder={
                canEditSets ? (ids) => void reorderExercises(ids) : undefined
              }
              onStartRest={(id) => rest.start(id)}
              lastRestSeconds={rest.lastSeconds}
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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
                busy={busy}
                onCorrect={() => setCorrecting(true)}
                onFeel={(feel) => void saveFeel(feel)}
                onRaise={() => raiseMaxes()}
              />
            ) : null}

            {session.status === "completed" && correcting ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Поправь подходы и сохрани. Тренировка уже сделана.
              </p>
            ) : null}

            {session.status === "planned" || session.status === "skipped" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void cancelToday()}
              >
                {SKIP_SESSION_LABEL}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <StickyActions>
          {rest.left != null ? (
            <div data-keyboard-secondary>
              <RestBar
                left={rest.left}
                targetKg={loadTarget}
                round={rest.round}
                onAdd={rest.add}
                onSubtract={rest.subtract}
                onStop={rest.stop}
                onRestart={rest.restart}
              />
            </div>
          ) : null}
          <Button
            type="button"
            className="h-14 w-full text-lg"
            disabled={busy || detail.exercises.length === 0}
            onClick={() => {
              rest.stop();
              void complete();
            }}
          >
            {detail.session.status === "planned" ? "Готово" : "Сохранить"}
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}
