"use client";

import { plateRemainingLine } from "@/lib/ai/quota-copy";
import { PLATE_IDLE_LINE } from "@/lib/flavor";
import { AI_PLATE_EMPTY, AI_PLATE_OFF, AI_PLATE_QUOTA } from "@/lib/messages";

export function PlateStatusCopy({
  idle,
  unavailable,
  exhausted,
  empty,
  remaining,
}: {
  idle: boolean;
  unavailable: boolean;
  exhausted: boolean;
  empty: boolean;
  remaining: number | null;
}) {
  if (unavailable) {
    return <p className="text-base text-muted-foreground">{AI_PLATE_OFF}</p>;
  }
  if (exhausted) {
    return <p className="text-base text-muted-foreground">{AI_PLATE_QUOTA}</p>;
  }

  const quotaLine = remaining == null ? null : plateRemainingLine(remaining);

  return (
    <>
      {idle ? (
        <p className="text-base text-muted-foreground">{PLATE_IDLE_LINE}</p>
      ) : null}
      {empty ? (
        <p className="text-base text-muted-foreground">{AI_PLATE_EMPTY}</p>
      ) : null}
      {quotaLine ? (
        <p className="text-sm text-muted-foreground">{quotaLine}</p>
      ) : null}
    </>
  );
}
