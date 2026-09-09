"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarbellMark,
  CookieMark,
  DumbbellMark,
  MugMark,
} from "@/components/layout/doodles";
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
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-18%,oklch(0.9_0.03_132_/_0.42),transparent_68%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(120%_85%_at_50%_-18%,oklch(0.42_0.035_140_/_0.38),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_8%_108%,oklch(0.84_0.03_145_/_0.16),transparent_62%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(70%_45%_at_8%_108%,oklch(0.32_0.03_145_/_0.28),transparent_62%)]" />
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="rest-wallpaper"
            width="360"
            height="460"
            patternUnits="userSpaceOnUse"
          >
            <Mark x={52} y={64} rotate={-8} scale={1.72}>
              <CookieMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={228} y={48} rotate={6} scale={1.68}>
              <MugMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={86} y={236} rotate={-6} scale={1.62}>
              <MugMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={268} y={268} rotate={8} scale={1.55}>
              <CookieMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={176} y={412} rotate={-10} scale={1.48}>
              <CookieMark ink="var(--wallpaper-ink)" />
            </Mark>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rest-wallpaper)" />
      </svg>
    </>
  );
}

function TrainingBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-18%,oklch(0.9_0.04_48_/_0.38),transparent_68%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(120%_85%_at_50%_-18%,oklch(0.4_0.05_36_/_0.4),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_92%_108%,oklch(0.82_0.05_42_/_0.14),transparent_62%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(70%_45%_at_92%_108%,oklch(0.3_0.05_32_/_0.3),transparent_62%)]" />
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="train-wallpaper-v4"
            width="360"
            height="460"
            patternUnits="userSpaceOnUse"
          >
            <Mark x={56} y={62} rotate={-8} scale={1.78}>
              <DumbbellMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={232} y={48} rotate={5} scale={1.62}>
              <BarbellMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={78} y={248} rotate={-4} scale={1.55}>
              <BarbellMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={254} y={276} rotate={-9} scale={1.82}>
              <DumbbellMark ink="var(--wallpaper-ink)" />
            </Mark>
            <Mark x={168} y={416} rotate={-6} scale={1.52}>
              <BarbellMark ink="var(--wallpaper-ink)" />
            </Mark>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#train-wallpaper-v4)" />
      </svg>
    </>
  );
}

function Mark({
  x,
  y,
  rotate,
  scale = 1,
  children,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {children}
    </g>
  );
}
