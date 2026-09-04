"use client";

import { Button } from "@/components/ui/button";

export function CreateDayButtons({
  onCreateRest,
  onCreateTraining,
  onCopyYesterday,
  busy,
}: {
  onCreateRest: () => void;
  onCreateTraining: () => void;
  onCopyYesterday: () => void;
  busy: boolean;
}) {
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
