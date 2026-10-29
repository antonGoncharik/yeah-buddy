"use client";

import { SessionScreenShortenButton } from "@/components/workout/session-screen-shorten-button";
import { SessionSoreBanner } from "@/components/workout/session-sore-banner";
import type { MuscleId, SessionDetail } from "@/lib/types";

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
      <SessionScreenShortenButton
        sessionId={sessionId}
        detail={detail}
        busy={busy}
        onShorten={onShorten}
        onPairsApplied={onPairsApplied}
      />
    </div>
  );
}
