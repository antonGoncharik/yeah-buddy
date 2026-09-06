"use client";

import { Button } from "@/components/ui/button";
import { DAY_TYPE_LABELS } from "@/lib/nutrition";

export function CreateDayButtons({
  onCreateRest,
  onCreateTraining,
  onCopyYesterday,
  busy,
  trainingFirst = false,
}: {
  onCreateRest: () => void;
  onCreateTraining: () => void;
  onCopyYesterday: () => void;
  busy: boolean;
  trainingFirst?: boolean;
}) {
  const rest = (
    <Button
      variant={trainingFirst ? "outline" : "default"}
      className="h-14 text-lg"
      disabled={busy}
      onClick={onCreateRest}
    >
      {DAY_TYPE_LABELS.rest}
    </Button>
  );
  const training = (
    <Button
      variant={trainingFirst ? "default" : "outline"}
      className="h-14 text-lg"
      disabled={busy}
      onClick={onCreateTraining}
    >
      {DAY_TYPE_LABELS.training}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
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
      <Button
        variant="ghost"
        className="h-14 text-lg"
        disabled={busy}
        onClick={onCopyYesterday}
      >
        Как вчера
      </Button>
    </div>
  );
}
