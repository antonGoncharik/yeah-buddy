"use client";

import { cn } from "@/lib/utils";
import { PLATE_DRAW } from "@/lib/workout/rest-load-plates";
import type { SidePlate } from "@/lib/workout/rest-load";

export function LoadBar({
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
