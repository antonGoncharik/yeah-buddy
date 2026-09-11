"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { useWorkoutsHub } from "@/components/workout/use-workouts-hub";
import { WorkoutsHubEmpty } from "@/components/workout/workouts-hub-empty";
import { WorkoutsHubNavSections } from "@/components/workout/workouts-hub-nav-sections";
import { WorkoutsHubQueueCta } from "@/components/workout/workouts-hub-queue-cta";
import { WorkoutsHubRecent } from "@/components/workout/workouts-hub-recent";
import { WorkoutsHubSessionCard } from "@/components/workout/workouts-hub-session-card";
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
    weightsHint,
    nextHasPlanMaxes,
    createOnDate,
    skipTemplate,
    unskipLast,
    pickTemplate,
  } = useWorkoutsHub();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error ? (
          <WorkoutsHubEmpty
            exercisesCount={exercises.length}
            session={session}
            nextTemplate={nextTemplate}
          />
        ) : null}

        {!loading && !error ? (
          <WorkoutsHubSessionCard
            unfinished={unfinished}
            session={session}
            sessionTemplate={sessionTemplate}
            nextTemplate={nextTemplate}
            followingTemplate={followingTemplate}
            sessionAction={sessionAction}
          />
        ) : null}

        {!loading && !error ? (
          <WorkoutsHubQueueCta
            session={session}
            nextTemplate={nextTemplate}
            followingTemplate={followingTemplate}
            activeTemplatesCount={activeTemplates.length}
            nextHasPlanMaxes={nextHasPlanMaxes}
            weightsHint={weightsHint}
            creating={creating}
            skipping={skipping}
            canUnskip={canUnskip}
            canBackfillYesterday={canBackfillYesterday}
            onStart={() => void createOnDate(nextTemplate?.id ?? "", date)}
            onSkip={() => void skipTemplate(nextTemplate?.id ?? "")}
            onUnskip={() => void unskipLast()}
            onBackfill={() =>
              void createOnDate(nextTemplate?.id ?? "", previousIsoDate(date))
            }
          />
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <WorkoutsHubNavSections
            macro={macro}
            session={session}
            sessionTemplate={sessionTemplate}
            nextTemplate={nextTemplate}
            phaseCircle={phaseCircle}
            phaseHint={phaseHint}
            activeTemplates={activeTemplates}
            creating={creating}
            skipping={skipping}
            onPickTemplate={(template) => void pickTemplate(template)}
          />
        ) : null}

        {!loading && !error ? <WorkoutsHubRecent recent={recent} /> : null}
      </div>
    </div>
  );
}
