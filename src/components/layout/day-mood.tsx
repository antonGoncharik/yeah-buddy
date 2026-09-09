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
      <div className="atmosphere-grain absolute inset-0 opacity-[0.16] mix-blend-multiply transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:opacity-0" />
      <div className="atmosphere-grain absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:opacity-[0.2]" />
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
      <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_-8%,oklch(0.78_0.04_132_/_0.22),transparent_58%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(90%_55%_at_50%_-8%,oklch(0.38_0.04_140_/_0.38),transparent_58%)]" />
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="rest-wallpaper"
            width="280"
            height="360"
            patternUnits="userSpaceOnUse"
          >
            <Mark x={38} y={46} rotate={-14} scale={1.05}>
              <CookieMark />
            </Mark>
            <Mark x={168} y={28} rotate={11} scale={0.92}>
              <ShakerMark />
            </Mark>
            <Mark x={248} y={118} rotate={18} scale={0.84}>
              <CookieMark />
            </Mark>
            <Mark x={72} y={168} rotate={-22} scale={0.9}>
              <ShakerMark />
            </Mark>
            <Mark x={196} y={214} rotate={8} scale={1}>
              <CookieMark />
            </Mark>
            <Mark x={34} y={268} rotate={16} scale={0.78}>
              <CookieMark />
            </Mark>
            <Mark x={250} y={288} rotate={-10} scale={1.08}>
              <ShakerMark />
            </Mark>
            <Mark x={142} y={328} rotate={-18} scale={0.86}>
              <CookieMark />
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
      <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_-8%,oklch(0.72_0.06_48_/_0.2),transparent_58%)] transition-opacity duration-[var(--theme-duration)] ease-[var(--ease-out-soft)] motion-reduce:transition-none dark:bg-[radial-gradient(90%_55%_at_50%_-8%,oklch(0.36_0.06_36_/_0.42),transparent_58%)]" />
      <svg aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id="train-wallpaper"
            width="280"
            height="360"
            patternUnits="userSpaceOnUse"
          >
            <Mark x={42} y={44} rotate={-12} scale={1}>
              <DumbbellMark />
            </Mark>
            <Mark x={176} y={36} rotate={16} scale={0.9}>
              <BarbellMark />
            </Mark>
            <Mark x={246} y={124} rotate={-8} scale={0.86}>
              <DumbbellMark />
            </Mark>
            <Mark x={64} y={172} rotate={20} scale={0.94}>
              <BarbellMark />
            </Mark>
            <Mark x={198} y={218} rotate={-18} scale={1.08}>
              <DumbbellMark />
            </Mark>
            <Mark x={36} y={276} rotate={10} scale={0.8}>
              <DumbbellMark />
            </Mark>
            <Mark x={238} y={292} rotate={8} scale={1}>
              <BarbellMark />
            </Mark>
            <Mark x={132} y={328} rotate={-14} scale={0.88}>
              <BarbellMark />
            </Mark>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#train-wallpaper)" />
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

function CookieMark() {
  return (
    <g
      fill="none"
      stroke="var(--wallpaper-ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <circle cx="0" cy="0" r="11" />
      <circle
        cx="-3.6"
        cy="-3.2"
        r="1.15"
        fill="var(--wallpaper-ink)"
        stroke="none"
      />
      <circle
        cx="3.4"
        cy="-4.1"
        r="1.05"
        fill="var(--wallpaper-ink)"
        stroke="none"
      />
      <circle
        cx="4.2"
        cy="2.4"
        r="1.2"
        fill="var(--wallpaper-ink)"
        stroke="none"
      />
      <circle
        cx="-2.2"
        cy="4.4"
        r="0.95"
        fill="var(--wallpaper-ink)"
        stroke="none"
      />
      <circle
        cx="1.1"
        cy="0.2"
        r="0.85"
        fill="var(--wallpaper-ink)"
        stroke="none"
      />
    </g>
  );
}

function ShakerMark() {
  return (
    <g
      fill="none"
      stroke="var(--wallpaper-ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <path d="M-4.2 -12.2 h8.4 v2.4 h-8.4 z" />
      <path d="M-5.4 -9.8 h10.8 v2.2 h-10.8 z" />
      <path d="M-5.4 -7.6 h10.8 v12.4 a4.2 4.2 0 0 1 -4.2 4.2 h-2.4 a4.2 4.2 0 0 1 -4.2 -4.2 z" />
      <path d="M-3.2 -0.6 h6.4" />
      <path d="M-2.2 3.2 h4.4" />
    </g>
  );
}

function DumbbellMark() {
  return (
    <g
      fill="none"
      stroke="var(--wallpaper-ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <path d="M-6.5 0 h13" />
      <rect x="-14.5" y="-5.2" width="4.4" height="10.4" rx="1.4" />
      <rect x="-11.2" y="-3.6" width="3.2" height="7.2" rx="1.1" />
      <rect x="8" y="-3.6" width="3.2" height="7.2" rx="1.1" />
      <rect x="10.1" y="-5.2" width="4.4" height="10.4" rx="1.4" />
    </g>
  );
}

function BarbellMark() {
  return (
    <g
      fill="none"
      stroke="var(--wallpaper-ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.55"
    >
      <path d="M-16.5 0 h33" />
      <rect x="-16.6" y="-7.2" width="3.1" height="14.4" rx="1.1" />
      <rect x="-13.4" y="-5.4" width="2.6" height="10.8" rx="1" />
      <rect x="-10.7" y="-3.6" width="2.1" height="7.2" rx="0.9" />
      <rect x="8.6" y="-3.6" width="2.1" height="7.2" rx="0.9" />
      <rect x="10.8" y="-5.4" width="2.6" height="10.8" rx="1" />
      <rect x="13.5" y="-7.2" width="3.1" height="14.4" rx="1.1" />
    </g>
  );
}
