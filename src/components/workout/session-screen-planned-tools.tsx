"use client";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { SessionSoreBanner } from "@/components/workout/session-sore-banner";
import type { MuscleId, SessionDetail } from "@/lib/types";
import { pairWith, writeSessionPairs } from "@/lib/workout/session-pairs";
import { canShortenSession } from "@/lib/workout/session-short";

export function SessionScreenPlannedTools({
  sessionId,
  detail,
  busy,
  onEase,
  onShorten,
  onPairsApplied,
}: {
  sessionId: string;
  detail: SessionDetail;
  busy: boolean;
  onEase: (muscles: MuscleId[]) => Promise<boolean>;
  onShorten: () => Promise<Array<[string, string]> | null>;
  onPairsApplied: (pairs: Record<string, string>) => void;
}) {
  const confirm = useConfirm();

  if (detail.session.status !== "planned") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <SessionSoreBanner
        sessionId={sessionId}
        disabled={busy}
        onEase={onEase}
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
              const nextPairs = await onShorten();
              if (!nextPairs || nextPairs.length === 0) {
                return;
              }
              const stored = nextPairs.reduce(
                (current, [left, right]) => pairWith(current, left, right),
                {} as Record<string, string>,
              );
              writeSessionPairs(sessionId, stored);
              onPairsApplied(stored);
            })();
          }}
        >
          Мало времени
        </Button>
      ) : null}
    </div>
  );
}
