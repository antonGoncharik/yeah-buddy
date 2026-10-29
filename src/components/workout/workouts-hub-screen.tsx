"use client";

import { GuideTipCard } from "@/components/guide/guide-tip-card";
import { useGuideTip } from "@/components/guide/use-guide-tip";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError } from "@/components/layout/screen-status";
import { PauseReturnCard } from "@/components/workout/pause-return-card";
import { ProgramEditableHintCard } from "@/components/workout/program-editable-hint-card";
import { useProgramEditableHint } from "@/components/workout/use-program-editable-hint";
import { useWorkoutsHub } from "@/components/workout/use-workouts-hub";
import { WorkoutsHubBarbellCard } from "@/components/workout/workouts-hub-barbell-card";
import { WorkoutsHubEmpty } from "@/components/workout/workouts-hub-empty";
import { WorkoutsHubNavSections } from "@/components/workout/workouts-hub-nav-sections";
import { WorkoutsHubQueueCta } from "@/components/workout/workouts-hub-queue-cta";
import { WorkoutsHubRecent } from "@/components/workout/workouts-hub-recent";
import { WorkoutsHubSessionCard } from "@/components/workout/workouts-hub-session-card";
import { WorkoutsHubSkeleton } from "@/components/workout/workouts-hub-skeleton";
import { previousIsoDate } from "@/lib/day/dates";

export function WorkoutsHubScreen() {
  const {
    date,
    todayLabel,
    loading,
    error,
    load,
    exercises,
    activeTemplates,
    macro,
    session,
    sessionTemplate,
    nextTemplate,
    followingTemplate,
    unfinished,
    recent,
    phaseCircle,
    canUnskip,
    canBackfillYesterday,
    creating,
    skipping,
    sessionAction,
    phaseHint,
    nextCanStart,
    createOnDate,
    unskipLast,
    skipNext,
    muscleRecoveryHint,
  } = useWorkoutsHub();
  const guideTip = useGuideTip("workouts");
  const editableHint = useProgramEditableHint();
  const showContent = !loading && !error;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {showContent ? <PauseReturnCard /> : null}
        {loading ? <WorkoutsHubSkeleton /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {showContent ? (
          <WorkoutsHubEmpty
            exercisesCount={exercises.length}
            session={session}
            nextTemplate={nextTemplate}
          />
        ) : null}

        {showContent ? (
          <WorkoutsHubSessionCard
            unfinished={unfinished}
            session={session}
            sessionTemplate={sessionTemplate}
            nextTemplate={nextTemplate}
            followingTemplate={followingTemplate}
            sessionAction={sessionAction}
          />
        ) : null}

        {showContent ? (
          <WorkoutsHubQueueCta
            session={session}
            nextTemplate={nextTemplate}
            followingTemplate={followingTemplate}
            exercises={exercises}
            phaseKey={macro?.phase?.phase_type ?? null}
            nextCanStart={nextCanStart}
            creating={creating}
            skipping={skipping}
            canUnskip={canUnskip}
            canBackfillYesterday={canBackfillYesterday}
            onStart={() =>
              void createOnDate(nextTemplate?.id ?? "", date, "today")
            }
            onSkip={(following) => void skipNext(following)}
            onUnskip={() => void unskipLast()}
            onBackfill={() =>
              void createOnDate(
                nextTemplate?.id ?? "",
                previousIsoDate(date),
                "yesterday",
              )
            }
          />
        ) : null}

        {showContent && editableHint.open ? (
          <ProgramEditableHintCard onDismiss={editableHint.dismiss} />
        ) : null}
        {showContent && !editableHint.open && guideTip.tip ? (
          <GuideTipCard tip={guideTip.tip} onDismiss={guideTip.dismiss} />
        ) : null}

        {showContent && muscleRecoveryHint ? (
          <p className="animate-rise px-1 text-sm text-muted-foreground">
            {muscleRecoveryHint}
          </p>
        ) : null}

        {showContent && exercises.length > 0 ? (
          <WorkoutsHubNavSections
            macro={macro}
            session={session}
            sessionTemplate={sessionTemplate}
            nextTemplate={nextTemplate}
            phaseCircle={phaseCircle}
            phaseHint={phaseHint}
            activeTemplates={activeTemplates}
          />
        ) : null}

        {showContent ? <WorkoutsHubRecent recent={recent} /> : null}

        {showContent ? <WorkoutsHubBarbellCard /> : null}
      </div>
    </div>
  );
}
