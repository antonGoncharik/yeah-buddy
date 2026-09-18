"use client";

import { Button } from "@/components/ui/button";
import { RestLoadGame } from "@/components/workout/rest-load-game";
import { REST_DONE_LABEL } from "@/lib/flavor";
import { formatRestClock } from "@/lib/workout/rest-timer";

export function RestBar({
  left,
  targetKg,
  round,
  onAdd,
  onSubtract,
  onStop,
  onRestart,
}: {
  left: number;
  targetKg: number;
  round: number;
  onAdd: () => void;
  onSubtract: () => void;
  onStop: () => void;
  onRestart: () => void;
}) {
  if (left === 0) {
    return (
      <div className="flex animate-recap-glow items-center gap-2 rounded-xl bg-background px-3 py-2">
        <p className="min-w-0 flex-1 text-lg font-semibold">
          {REST_DONE_LABEL}
        </p>
        <Button
          type="button"
          className="h-11 px-4 text-base"
          onClick={onRestart}
        >
          Ещё раз
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-3 text-base"
          onClick={onStop}
        >
          Скрыть
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-background px-3 py-2">
      <div className="flex items-center gap-1.5">
        <p className="min-w-0 flex-1 text-3xl font-semibold tracking-tight tabular-nums">
          {formatRestClock(left)}
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3.5 text-base"
          onClick={onSubtract}
        >
          −30
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3.5 text-base"
          onClick={onAdd}
        >
          +30
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-3 text-base"
          onClick={onStop}
        >
          Стоп
        </Button>
      </div>
      <RestLoadGame key={round} targetKg={targetKg} />
    </div>
  );
}
