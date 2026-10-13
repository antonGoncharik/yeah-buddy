"use client";

import { cn } from "@/lib/utils";
import { balanceTiltDeg } from "@/lib/workout/barbell-balance";
import type { SidePlate } from "@/lib/workout/rest-load";
import { PLATE_DRAW } from "@/lib/workout/rest-load-plates";

export function BalanceBar({
  left,
  right,
  dumped,
}: {
  left: readonly number[];
  right: readonly number[];
  dumped: boolean;
}) {
  const leftDrawn = layoutSide(left);
  const rightDrawn = layoutSide(right);
  const reach = Math.max(28, leftDrawn.reach, rightDrawn.reach);
  const angle = balanceTiltDeg(left, right);

  return (
    <svg
      aria-hidden
      viewBox={`${-reach} -11 ${reach * 2} 22`}
      className={cn(
        "h-16 w-full origin-center text-foreground",
        dumped
          ? "animate-dumbbell-wiggle"
          : "transition-transform duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
      )}
      style={dumped ? undefined : { transform: `rotate(${angle}deg)` }}
    >
      <rect
        x={-reach + 1.2}
        y="-0.7"
        width={reach * 2 - 2.4}
        height="1.4"
        rx="0.7"
        fill="currentColor"
      />
      {leftDrawn.plates.map((plate) => (
        <PlateRect key={`l-${plate.x}-${plate.kg}`} side={-1} plate={plate} />
      ))}
      {rightDrawn.plates.map((plate) => (
        <PlateRect key={`r-${plate.x}-${plate.kg}`} side={1} plate={plate} />
      ))}
      <Collar x={leftDrawn.collar} />
      <Collar x={rightDrawn.collar} />
    </svg>
  );
}

function layoutSide(plates: readonly number[]): {
  plates: Array<{
    kg: number;
    x: number;
    size: { w: number; h: number };
    pop: boolean;
  }>;
  reach: number;
  collar: number;
} {
  const sleeve = 9.2;
  const gap = 0.35;
  let cursor = sleeve;
  const drawn = plates.map((kg, index) => {
    const size = plateSize(kg);
    const x = cursor;
    cursor += size.w + gap;
    return { kg, x, size, pop: index === plates.length - 1 };
  });
  const last = drawn.at(-1);
  const collar = last ? last.x + last.size.w + 0.9 : sleeve;
  return { plates: drawn, reach: collar + 2.4, collar };
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

function Collar({ x }: { x: number }) {
  return <circle cx={x} cy="0" r="1.15" fill="currentColor" />;
}

function plateSize(kg: number): { w: number; h: number } {
  const found = PLATE_DRAW[kg as SidePlate];
  if (found) {
    return found;
  }
  return { w: 2, h: 8 };
}
