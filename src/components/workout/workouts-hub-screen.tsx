"use client";

import { useGuideTip } from "@/components/guide/use-guide-tip";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenError } from "@/components/layout/screen-status";
import { useProgramEditableHint } from "@/components/workout/use-program-editable-hint";
import { useWorkoutsHub } from "@/components/workout/use-workouts-hub";
import { WorkoutsHubBody } from "@/components/workout/workouts-hub-body";
import { WorkoutsHubSkeleton } from "@/components/workout/workouts-hub-skeleton";

export function WorkoutsHubScreen() {
  const hub = useWorkoutsHub();
  const { todayLabel, loading, error, load } = hub;
  const guideTip = useGuideTip("workouts");
  const editableHint = useProgramEditableHint();
  const showContent = !loading && !error;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <WorkoutsHubSkeleton /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {showContent ? (
          <WorkoutsHubBody
            hub={hub}
            guideTip={guideTip}
            editableHint={editableHint}
          />
        ) : null}
      </div>
    </div>
  );
}
