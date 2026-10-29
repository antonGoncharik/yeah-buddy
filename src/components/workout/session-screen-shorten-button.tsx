"use client";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import type { SessionDetail } from "@/lib/types";
import { pairWith, writeSessionPairs } from "@/lib/workout/session-pairs";
import { canShortenSession } from "@/lib/workout/session-short";

export function SessionScreenShortenButton({
  sessionId,
  detail,
  busy,
  onShorten,
  onPairsApplied,
}: {
  sessionId: string;
  detail: SessionDetail;
  busy: boolean;
  onShorten: () => Promise<Array<[string, string]> | null>;
  onPairsApplied: (pairs: Record<string, string>) => void;
}) {
  const confirm = useConfirm();

  if (!canShortenSession(detail.exercises)) {
    return null;
  }

  return (
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
  );
}
