"use client";

import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { CATCH_UP_EMPTY_HINT } from "@/lib/messages";
import { DAY_TYPE_LABELS } from "@/lib/nutrition";

export function CreateDayButtons({
  onCreateRest,
  onCreateTraining,
  onCopyYesterday,
  busy,
  trainingFirst = false,
  showCopy = true,
  catchUp = false,
}: {
  onCreateRest: () => void;
  onCreateTraining: () => void;
  onCopyYesterday: () => void;
  busy: boolean;
  trainingFirst?: boolean;
  showCopy?: boolean;
  catchUp?: boolean;
}) {
  const rest = (
    <Button
      variant={trainingFirst ? "outline" : "default"}
      className="h-14 gap-2 text-lg"
      disabled={busy}
      onClick={onCreateRest}
    >
      <CookieDoodle className="size-4" />
      {DAY_TYPE_LABELS.rest}
    </Button>
  );
  const training = (
    <Button
      variant={trainingFirst ? "default" : "outline"}
      className="h-14 gap-2 text-lg"
      disabled={busy}
      onClick={onCreateTraining}
    >
      <DumbbellDoodle />
      {DAY_TYPE_LABELS.training}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {catchUp ? (
        <p className="text-base text-muted-foreground">{CATCH_UP_EMPTY_HINT}</p>
      ) : null}
      {trainingFirst ? (
        <>
          {training}
          {rest}
        </>
      ) : (
        <>
          {rest}
          {training}
        </>
      )}
      {showCopy ? (
        <Button
          variant="ghost"
          className="h-14 text-lg"
          disabled={busy}
          onClick={onCopyYesterday}
        >
          Как вчера
        </Button>
      ) : null}
    </div>
  );
}
