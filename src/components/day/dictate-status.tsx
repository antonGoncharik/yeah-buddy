"use client";

import { dictateRemainingLine } from "@/lib/ai/quota-copy";
import { formatSpeechClock } from "@/lib/ai/speech-wav";
import { DICTATE_IDLE_LINE, DICTATE_SPEAK_LINE } from "@/lib/flavor";
import {
  AI_DICTATE_EMPTY,
  AI_DICTATE_OFF,
  AI_DICTATE_QUOTA,
} from "@/lib/messages";

export function DictateStatusCopy({
  idle,
  unavailable,
  exhausted,
  empty,
  recording,
  seconds,
  remaining,
}: {
  idle: boolean;
  unavailable: boolean;
  exhausted: boolean;
  empty: boolean;
  recording: boolean;
  seconds: number;
  remaining: number | null;
}) {
  if (unavailable) {
    return <p className="text-base text-muted-foreground">{AI_DICTATE_OFF}</p>;
  }
  if (exhausted) {
    return (
      <p className="text-base text-muted-foreground">{AI_DICTATE_QUOTA}</p>
    );
  }

  const quotaLine = remaining == null ? null : dictateRemainingLine(remaining);

  return (
    <>
      {recording ? (
        <p className="text-base text-muted-foreground">
          {DICTATE_SPEAK_LINE} {formatSpeechClock(seconds)}
        </p>
      ) : null}
      {idle && !recording ? (
        <p className="text-base text-muted-foreground">{DICTATE_IDLE_LINE}</p>
      ) : null}
      {empty ? (
        <p className="text-base text-muted-foreground">{AI_DICTATE_EMPTY}</p>
      ) : null}
      {quotaLine && !recording ? (
        <p className="text-sm text-muted-foreground">{quotaLine}</p>
      ) : null}
    </>
  );
}
