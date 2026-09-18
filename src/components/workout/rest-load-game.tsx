"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  addSidePlate,
  loadedKg,
  loadStatus,
  plateLabel,
  restLoadLine,
  SIDE_PLATES,
  type SidePlate,
  undoSidePlate,
} from "@/lib/workout/rest-load";

const PLATE_DRAW: Record<SidePlate, { w: number; h: number }> = {
  25: { w: 3.4, h: 20 },
  20: { w: 3.1, h: 17.2 },
  15: { w: 2.8, h: 14.6 },
  10: { w: 2.5, h: 12 },
  5: { w: 2.2, h: 9.2 },
  2.5: { w: 1.9, h: 7.2 },
  1.25: { w: 1.6, h: 5.6 },
};

export function RestLoadGame({ targetKg }: { targetKg: number }) {
  const [plates, setPlates] = useState<number[]>([]);
  const currentKg = loadedKg(plates);
  const status = loadStatus(currentKg, targetKg);
  const line = restLoadLine(currentKg, targetKg);

  function setNext(next: number[]) {
    const prev = loadStatus(loadedKg(plates), targetKg);
    const nextStatus = loadStatus(loadedKg(next), targetKg);
    if (nextStatus === "hit" && prev !== "hit") {
      haptic("success");
    } else if (nextStatus === "over" && prev !== "over") {
      haptic("error");
    } else {
      haptic("tap");
    }
    setPlates(next);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        status === "hit" && "animate-recap-glow",
      )}
    >
      <button
        type="button"
        className="flex flex-col items-center gap-1 pt-1"
        aria-label="Сбросить блины"
        onClick={() => {
          if (plates.length === 0) {
            return;
          }
          haptic("tick");
          setPlates([]);
        }}
      >
        <LoadBar plates={plates} over={status === "over"} />
        <p
          className={cn(
            "text-sm font-medium",
            status === "over"
              ? "text-destructive"
              : status === "hit"
                ? "text-foreground"
                : "text-muted-foreground",
          )}
        >
          {line}
        </p>
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDE_PLATES.map((plate) => (
          <Button
            key={plate}
            type="button"
            variant="outline"
            className="h-11 px-1.5 text-base"
            onClick={() => setNext(addSidePlate(plates, plate))}
          >
            {plateLabel(plate)}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-1.5 text-base"
          disabled={plates.length === 0}
          onClick={() => setNext(undoSidePlate(plates))}
        >
          Снять
        </Button>
      </div>
    </div>
  );
}

function LoadBar({
  plates,
  over,
}: {
  plates: ReadonlyArray<number>;
  over: boolean;
}) {
  const sleeve = 9.2;
  const gap = 0.35;
  let cursor = sleeve;
  const drawn = plates.map((kg, index) => {
    const size = plateSize(kg);
    const x = cursor;
    cursor += size.w + gap;
    return { kg, x, size, pop: index === plates.length - 1 };
  });
  const reach = Math.max(28, cursor + 2.4);
  const last = drawn.at(-1);

  return (
    <svg
      aria-hidden
      viewBox={`${-reach} -11 ${reach * 2} 22`}
      className={cn(
        "h-10 w-full text-foreground",
        over && "animate-dumbbell-wiggle",
      )}
    >
      <rect
        x={-reach + 1.2}
        y="-0.7"
        width={reach * 2 - 2.4}
        height="1.4"
        rx="0.7"
        fill="currentColor"
      />
      {drawn.length === 0 ? (
        <>
          <Collar x={-sleeve} />
          <Collar x={sleeve} />
        </>
      ) : null}
      {drawn.map((plate) => (
        <g key={`${plate.x}-${plate.kg}`}>
          <PlateRect side={-1} plate={plate} />
          <PlateRect side={1} plate={plate} />
        </g>
      ))}
      {last ? (
        <>
          <Collar x={-(last.x + last.size.w + 0.9)} pop={over && last.pop} />
          <Collar x={last.x + last.size.w + 0.9} pop={over && last.pop} />
        </>
      ) : null}
    </svg>
  );
}

function PlateRect({
  side,
  plate,
}: {
  side: 1 | -1;
  plate: {
    kg: number;
    x: number;
    size: { w: number; h: number };
    pop: boolean;
  };
}) {
  const x = side < 0 ? -(plate.x + plate.size.w) : plate.x;
  return (
    <rect
      className={plate.pop ? "doodle-plate-extra" : undefined}
      x={x}
      y={-plate.size.h / 2}
      width={plate.size.w}
      height={plate.size.h}
      rx="0.55"
      fill="currentColor"
    />
  );
}

function Collar({ x, pop = false }: { x: number; pop?: boolean }) {
  return (
    <circle
      className={pop ? "doodle-plate-extra" : undefined}
      cx={x}
      cy="0"
      r="1.15"
      fill="currentColor"
    />
  );
}

function plateSize(kg: number): { w: number; h: number } {
  const found = PLATE_DRAW[kg as SidePlate];
  if (found) {
    return found;
  }
  return { w: 2, h: 8 };
}
