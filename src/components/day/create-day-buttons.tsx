"use client";

import { Button } from "@/components/ui/button";

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
  if (trainingFirst) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          className="h-14 text-lg"
          disabled={busy}
          onClick={onCreateTraining}
        >
          Тренировка
        </Button>
        <Button
          variant="outline"
          className="h-14 text-lg"
          disabled={busy}
          onClick={onCreateRest}
        >
          Отдых
        </Button>
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

  return (
    <div className="flex flex-col gap-3">
      <Button className="h-14 text-lg" disabled={busy} onClick={onCreateRest}>
        Отдых
      </Button>
      <Button
        className="h-14 text-lg"
        disabled={busy}
        onClick={onCreateTraining}
      >
        Тренировка
      </Button>
      <Button
        variant="outline"
        className="h-14 text-lg"
        disabled={busy}
        onClick={onCopyYesterday}
      >
        Как вчера
      </Button>
    </div>
  );
}
