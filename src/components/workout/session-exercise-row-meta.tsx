"use client";

export function SessionExerciseRowMeta({
  diaryCompact,
  focused,
  showActual,
  slotLine,
  lastTimeLine,
  recordLine,
  pairName,
  targetLine,
}: {
  diaryCompact: boolean;
  focused: boolean;
  showActual: boolean;
  slotLine: string;
  lastTimeLine: string | null;
  recordLine: string | null;
  pairName: string | null;
  targetLine: string | null;
}) {
  return (
    <>
      {slotLine && (!diaryCompact || focused) ? (
        <p className="-mt-1 text-sm leading-snug text-muted-foreground">
          {slotLine}
        </p>
      ) : null}
      {lastTimeLine && !showActual ? (
        <p className="-mt-1 text-sm leading-snug text-muted-foreground">
          {lastTimeLine}
        </p>
      ) : null}
      {recordLine ? (
        <p className="-mt-1 text-base font-medium text-foreground">
          {recordLine}
        </p>
      ) : null}
      {pairName ? (
        <p className="-mt-1 text-sm leading-snug text-muted-foreground">
          В паре с {pairName}
        </p>
      ) : null}
      {targetLine ? (
        <p className="-mt-1 text-sm leading-snug text-muted-foreground">
          {targetLine}
        </p>
      ) : null}
    </>
  );
}
