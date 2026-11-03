"use client";

import { GuideTipCard } from "@/components/guide/guide-tip-card";
import type { useGuideTip } from "@/components/guide/use-guide-tip";
import { PauseReturnCard } from "@/components/workout/pause-return-card";
import { ProgramEditableHintCard } from "@/components/workout/program-editable-hint-card";
import type { useProgramEditableHint } from "@/components/workout/use-program-editable-hint";
import type { WorkoutsHubModel } from "@/components/workout/use-workouts-hub";
import { WorkoutsHubEmpty } from "@/components/workout/workouts-hub-empty";
import { WorkoutsHubNavSections } from "@/components/workout/workouts-hub-nav-sections";
import { WorkoutsHubQueueCta } from "@/components/workout/workouts-hub-queue-cta";
import { WorkoutsHubRecent } from "@/components/workout/workouts-hub-recent";
import { WorkoutsHubSessionCard } from "@/components/workout/workouts-hub-session-card";
import { previousIsoDate } from "@/lib/day/dates";

export function WorkoutsHubBody({
  hub,
  guideTip,
  editableHint,
}: {
  hub: WorkoutsHubModel;
  guideTip: ReturnType<typeof useGuideTip>;
  editableHint: ReturnType<typeof useProgramEditableHint>;
}) {
  const {
    date,
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
  } = hub;

  return (
    <>
      <PauseReturnCard />

      <WorkoutsHubEmpty
        exercisesCount={exercises.length}
        session={session}
        nextTemplate={nextTemplate}
      />

      <WorkoutsHubSessionCard
        unfinished={unfinished}
        session={session}
        sessionTemplate={sessionTemplate}
        nextTemplate={nextTemplate}
        followingTemplate={followingTemplate}
        sessionAction={sessionAction}
      />

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
        onStart={() => void createOnDate(nextTemplate?.id ?? "", date, "today")}
        onSkip={(following) => void skipNext(following)}
        onUnskip={() => void unskipLast()}
        onBackfill={() =>
          void createOnDate(
            nextTemplate?.id ?? "",
            previousIsoDate(date),
            "yesterday",
          )
        }
        laterNames={laterQueueNames(activeTemplates, nextTemplate?.id ?? null)}
      />

      {editableHint.open ? (
        <ProgramEditableHintCard onDismiss={editableHint.dismiss} />
      ) : null}
      {!editableHint.open && guideTip.tip ? (
        <GuideTipCard tip={guideTip.tip} onDismiss={guideTip.dismiss} />
      ) : null}

      {muscleRecoveryHint ? (
        <p className="animate-rise px-1 text-sm text-muted-foreground">
          {muscleRecoveryHint}
        </p>
      ) : null}

      {exercises.length > 0 ? (
        <WorkoutsHubNavSections
          macro={macro}
          phaseCircle={phaseCircle}
          phaseHint={phaseHint}
        />
      ) : null}

      <WorkoutsHubRecent recent={recent} />
    </>
  );
}

function laterQueueNames(
  active: { id: string; name: string }[],
  nextId: string | null,
): string[] {
  if (active.length === 0) {
    return [];
  }
  const index =
    nextId == null ? -1 : active.findIndex((item) => item.id === nextId);
  const ordered =
    index >= 0
      ? [...active.slice(index + 1), ...active.slice(0, index)]
      : active;
  return ordered.slice(0, 2).map((item) => item.name);
}
