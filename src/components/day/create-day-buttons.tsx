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
      <Button className="h-12 text-base" disabled={busy} onClick={onCreateRest}>
        Создать день отдыха
      </Button>
      <Button
        className="h-12 text-base"
        disabled={busy}
        onClick={onCreateTraining}
      >
        Создать тренировочный день
      </Button>
      <Button
        variant="outline"
        className="h-12 text-base"
        disabled={busy}
        onClick={onCopyYesterday}
      >
        Скопировать вчера
      </Button>
    </div>
  );
}
