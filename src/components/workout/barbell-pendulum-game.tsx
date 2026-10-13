"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  PENDULUM_AMPLITUDE_DEG,
  pendulumAngleDeg,
  pendulumInWindow,
  pendulumPeriodMs,
  pendulumPlateKg,
  pendulumWindowDeg,
} from "@/lib/workout/barbell-pendulum";
import {
  readPendulumBest,
  recordPendulumHeight,
} from "@/lib/workout/barbell-pendulum-storage";
import type { SidePlate } from "@/lib/workout/rest-load";
import { PLATE_DRAW } from "@/lib/workout/rest-load-plates";

const BAR_TOP = 56;
const MIN_Y = 8;
const NATURAL_STEP = 6.2;
const PLATE_THICK = 4.8;

export function BarbellPendulumGame() {
  const reduced = useReducedMotion();
  const [stack, setStack] = useState<Array<{ id: number; kg: SidePlate }>>([]);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(0);
  const [angle, setAngle] = useState(PENDULUM_AMPLITUDE_DEG);
  const angleRef = useRef(PENDULUM_AMPLITUDE_DEG);
  const heightRef = useRef(0);
  const nextId = useRef(1);
  const overRef = useRef(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    overRef.current = over;
  }, [over]);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    setBest(readPendulumBest());
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let phase = Math.PI / 2;
    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      if (!overRef.current) {
        const period = pendulumPeriodMs(heightRef.current, reducedRef.current);
        phase += (dt / period) * Math.PI * 2;
        const next = pendulumAngleDeg(phase);
        angleRef.current = next;
        setAngle(next);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function catchPlate() {
    if (overRef.current) {
      return;
    }
    const stacked = heightRef.current;
    const windowDeg = pendulumWindowDeg(stacked, reducedRef.current);
    if (!pendulumInWindow(angleRef.current, windowDeg)) {
      overRef.current = true;
      setOver(true);
      haptic("error");
      return;
    }
    const next = stacked + 1;
    const id = nextId.current;
    nextId.current += 1;
    heightRef.current = next;
    setStack((plates) => [...plates, { id, kg: pendulumPlateKg(stacked) }]);
    setBest(recordPendulumHeight(next));
    haptic(next % 5 === 0 ? "success" : "tap");
  }

  function replay() {
    heightRef.current = 0;
    overRef.current = false;
    setStack([]);
    setOver(false);
    haptic("tick");
  }

  const height = stack.length;
  const step = stackStep(height + 1);
  const swingKg = pendulumPlateKg(height);
  const swingCenter = BAR_TOP - (height + 0.5) * step;
  const line = over
    ? height === 0
      ? "Не сел."
      : `Башня ${height}.`
    : `На грифе ${height}`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="w-full"
        aria-label="Поймать блин"
        disabled={over}
        onClick={catchPlate}
      >
        <svg
          aria-hidden
          viewBox="-48 -2 96 68"
          className={cn(
            "h-52 w-full text-foreground",
            over && "text-destructive",
          )}
        >
          <line
            x1="0"
            y1="6"
            x2="0"
            y2={BAR_TOP - 1}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="0.6"
          />
          <rect
            x="-42"
            y={BAR_TOP}
            width="84"
            height="2.2"
            rx="1.1"
            fill="currentColor"
          />
          {stack.map((plate, index) => {
            const width = plateWidth(plate.kg);
            const y = BAR_TOP - (index + 1) * step;
            return (
              <rect
                key={plate.id}
                x={-width / 2}
                y={y}
                width={width}
                height={PLATE_THICK}
                rx="0.6"
                fill="currentColor"
              />
            );
          })}
          <g transform={`rotate(${angle})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={Math.max(4, swingCenter - PLATE_THICK)}
              stroke="currentColor"
              strokeWidth="0.7"
            />
            <PendulumPlate kg={swingKg} centerY={swingCenter} />
          </g>
        </svg>
      </button>
      <p
        className={cn(
          "text-center text-sm font-medium",
          over ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {line}
      </p>
      {best > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          Рекорд {best}
        </p>
      ) : null}
      {over ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 text-base"
          onClick={replay}
        >
          Ещё раз
        </Button>
      ) : (
        <Button type="button" className="h-14 text-lg" onClick={catchPlate}>
          Лови
        </Button>
      )}
    </div>
  );
}

function PendulumPlate({ kg, centerY }: { kg: number; centerY: number }) {
  const width = plateWidth(kg);
  return (
    <rect
      x={-width / 2}
      y={centerY - PLATE_THICK / 2}
      width={width}
      height={PLATE_THICK}
      rx="0.6"
      fill="currentColor"
    />
  );
}

function plateWidth(kg: number): number {
  const found = PLATE_DRAW[kg as SidePlate];
  if (!found) {
    return 8;
  }
  return Math.min(18, found.h * 0.85);
}

function stackStep(slots: number): number {
  const room = BAR_TOP - MIN_Y;
  if (slots <= 0) {
    return NATURAL_STEP;
  }
  return Math.min(NATURAL_STEP, room / slots);
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}
