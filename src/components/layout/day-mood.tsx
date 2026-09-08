"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type DayMood = "rest" | "training";

const DayMoodContext = createContext<{
  mood: DayMood | null;
  setMood: (mood: DayMood | null) => void;
} | null>(null);

export function DayMoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<DayMood | null>(null);

  const setMood = useCallback((next: DayMood | null) => {
    setMoodState(next);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (mood) {
      root.dataset.day = mood;
      return;
    }
    delete root.dataset.day;
  }, [mood]);

  const value = useMemo(() => ({ mood, setMood }), [mood, setMood]);

  return (
    <DayMoodContext.Provider value={value}>{children}</DayMoodContext.Provider>
  );
}

export function useDayMood() {
  const context = useContext(DayMoodContext);
  if (!context) {
    throw new Error("useDayMood must be used within DayMoodProvider");
  }
  return context;
}

export function DayBackdrop() {
  const { mood } = useDayMood();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="atmosphere-grain absolute inset-0 opacity-[0.22] mix-blend-multiply dark:opacity-[0.28] dark:mix-blend-overlay" />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          mood === "rest" ? "opacity-100" : "opacity-0",
        )}
      >
        <RestBackdrop />
      </div>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          mood === "training" ? "opacity-100" : "opacity-0",
        )}
      >
        <TrainingBackdrop />
      </div>
    </div>
  );
}

function RestBackdrop() {
  return (
    <>
      <div className="absolute inset-0 mix-blend-multiply motion-safe:animate-rest-drift bg-[linear-gradient(168deg,oklch(0.62_0.05_132_/_0.28)_0%,transparent_36%)] dark:bg-[linear-gradient(168deg,oklch(0.42_0.05_140_/_0.42)_0%,transparent_40%)] dark:mix-blend-soft-light" />
      <div className="absolute inset-y-0 left-2 w-px bg-[oklch(0.42_0.06_132_/_0.32)] dark:bg-[oklch(0.82_0.04_140_/_0.28)]" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <Specks
          points={REST_DUST}
          className="fill-[oklch(0.38_0.06_140_/_0.34)] dark:fill-[oklch(0.82_0.04_145_/_0.26)]"
        />
      </svg>
    </>
  );
}

function TrainingBackdrop() {
  return (
    <>
      <div className="absolute inset-0 motion-safe:animate-train-heat">
        <div className="absolute -top-[18%] left-[10%] h-[145%] w-[54%] origin-top rotate-[19deg] bg-[oklch(0.52_0.08_42_/_0.16)] mix-blend-multiply dark:bg-[oklch(0.62_0.07_42_/_0.28)] dark:mix-blend-soft-light" />
        <div className="absolute -top-[18%] left-[40%] h-[145%] w-[9%] origin-top rotate-[19deg] bg-[oklch(0.58_0.11_38_/_0.2)] mix-blend-multiply dark:bg-[oklch(0.74_0.09_48_/_0.22)] dark:mix-blend-soft-light" />
        <div className="absolute -top-[20%] left-[49%] h-[148%] w-px origin-top rotate-[19deg] bg-[oklch(0.48_0.13_38_/_0.5)] dark:bg-[oklch(0.82_0.1_48_/_0.4)]" />
      </div>
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M 400 0 L 400 236 L 228 0 Z"
          className="fill-[oklch(0.48_0.13_38_/_0.14)] dark:fill-[oklch(0.58_0.1_36_/_0.18)]"
        />
        <circle
          cx="-18"
          cy="692"
          r="176"
          fill="none"
          strokeWidth="18"
          className="stroke-[oklch(0.38_0.08_40_/_0.28)] dark:stroke-[oklch(0.74_0.06_42_/_0.26)]"
        />
        <circle
          cx="-18"
          cy="692"
          r="128"
          fill="none"
          strokeWidth="2.5"
          className="stroke-[oklch(0.4_0.06_42_/_0.2)] dark:stroke-[oklch(0.76_0.05_44_/_0.18)]"
        />
        <circle
          cx="-18"
          cy="692"
          r="42"
          fill="none"
          strokeWidth="11"
          className="stroke-[oklch(0.4_0.1_38_/_0.26)] dark:stroke-[oklch(0.7_0.08_40_/_0.24)]"
        />
        <Specks
          points={TRAIN_DUST}
          className="fill-[oklch(0.48_0.13_38_/_0.34)] dark:fill-[oklch(0.7_0.1_42_/_0.28)]"
        />
      </svg>
    </>
  );
}

function Specks({
  points,
  className,
}: {
  points: readonly (readonly [number, number, number])[];
  className: string;
}) {
  return (
    <g>
      {points.map(([cx, cy, r]) => (
        <circle
          key={`${cx}-${cy}-${r}`}
          cx={cx}
          cy={cy}
          r={r}
          className={className}
        />
      ))}
    </g>
  );
}

const REST_DUST = [
  [46, 52, 1.15],
  [62, 28, 0.7],
  [88, 44, 0.85],
  [118, 18, 0.55],
  [154, 36, 0.7],
  [22, 88, 0.6],
  [74, 76, 0.5],
  [196, 24, 0.45],
] as const;

const TRAIN_DUST = [
  [372, 18, 1.3],
  [348, 34, 0.85],
  [390, 48, 1.05],
  [326, 16, 0.6],
  [358, 62, 0.7],
  [312, 44, 0.5],
  [384, 82, 0.9],
  [338, 78, 0.55],
  [366, 98, 0.65],
  [396, 112, 0.5],
  [302, 22, 0.45],
  [378, 140, 0.55],
  [354, 8, 0.75],
] as const;
