"use client";

import { useConfirm } from "@/components/layout/confirm-provider";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { RestBar } from "@/components/workout/rest-bar";
import type { SessionDetail } from "@/lib/types";
import { upcomingWorkLine } from "@/lib/workout/next-load";
import { formatRestClock } from "@/lib/workout/rest-timer";

export function SessionScreenStickyFooter({
  detail,
  busy,
  openSetIds,
  restLeft,
  restFinishedAway,
  loadTarget,
  restRound,
  canRest,
  focusExerciseId,
  lastRestSeconds,
  onComplete,
  onRestAdd,
  onRestSubtract,
  onRestStop,
  onRestRestart,
  onRestStart,
}: {
  detail: SessionDetail;
  busy: boolean;
  openSetIds: string[];
  restLeft: number | null;
  restFinishedAway: boolean;
  loadTarget: number;
  restRound: number;
  canRest: boolean;
  focusExerciseId: string | null;
  lastRestSeconds: number;
  onComplete: () => Promise<void>;
  onRestAdd: () => void;
  onRestSubtract: () => void;
  onRestStop: () => void;
  onRestRestart: () => void;
  onRestStart: (exerciseId: string) => void;
}) {
  const confirm = useConfirm();
  const planned = detail.session.status === "planned";

  return (
    <StickyActions className="[&>div]:gap-4">
      {restLeft != null ? (
        <div data-keyboard-secondary>
          <RestBar
            away={restFinishedAway}
            left={restLeft}
            targetKg={loadTarget}
            nextLine={upcomingWorkLine(
              detail.exercises.map((item) => ({
                name: item.exercise.short_name || item.exercise.name,
                sets: item.sets,
              })),
              openSetIds,
            )}
            round={restRound}
            onAdd={onRestAdd}
            onSubtract={onRestSubtract}
            onStop={onRestStop}
            onRestart={onRestRestart}
          />
        </div>
      ) : null}
      {canRest && restLeft == null && focusExerciseId ? (
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full text-base"
          onClick={() => onRestStart(focusExerciseId)}
        >
          Отдых {formatRestClock(lastRestSeconds)}
        </Button>
      ) : null}
      <Button
        type="button"
        className="mt-2 h-14 w-full text-lg"
        disabled={busy || detail.exercises.length === 0}
        onClick={() => {
          void (async () => {
            if (planned) {
              const ok = await confirm({
                message: "Закрыть тренировку?",
                confirmLabel: "Готово",
                cancelLabel: "Ещё правлю",
              });
              if (!ok) {
                return;
              }
            }
            onRestStop();
            await onComplete();
          })();
        }}
      >
        {busy ? "Сохраняю…" : planned ? "Готово" : "Сохранить"}
      </Button>
    </StickyActions>
  );
}
