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
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.48_0.05_132_/_0.09)_1.15px,transparent_1.15px)] bg-size-[28px_28px] dark:bg-[radial-gradient(oklch(0.72_0.04_140_/_0.1)_1.15px,transparent_1.15px)]" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full motion-safe:animate-rest-drift"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="rest-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>
        <circle
          cx="70"
          cy="140"
          r="160"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.8_0.05_132_/_0.42)] dark:fill-[oklch(0.36_0.05_140_/_0.36)]"
        />
        <circle
          cx="340"
          cy="520"
          r="200"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.84_0.04_150_/_0.3)] dark:fill-[oklch(0.38_0.04_155_/_0.26)]"
        />
        <ellipse
          cx="200"
          cy="780"
          rx="240"
          ry="140"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.88_0.04_118_/_0.3)] dark:fill-[oklch(0.34_0.04_125_/_0.24)]"
        />
        <circle
          cx="210"
          cy="360"
          r="120"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.9_0.03_145_/_0.18)] dark:fill-[oklch(0.34_0.04_148_/_0.16)]"
        />
        <circle
          cx="48"
          cy="90"
          r="72"
          fill="none"
          strokeWidth="14"
          className="stroke-[oklch(0.5_0.08_132_/_0.26)] dark:stroke-[oklch(0.7_0.06_140_/_0.22)]"
        />
        <circle
          cx="48"
          cy="90"
          r="118"
          fill="none"
          strokeWidth="7"
          className="stroke-[oklch(0.52_0.06_140_/_0.2)] dark:stroke-[oklch(0.72_0.05_145_/_0.18)]"
        />
        <circle
          cx="48"
          cy="90"
          r="162"
          fill="none"
          strokeWidth="3"
          className="stroke-[oklch(0.5_0.05_128_/_0.16)] dark:stroke-[oklch(0.74_0.04_136_/_0.14)]"
        />
        <path
          d="M 430 160 A 170 170 0 0 0 430 620"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className="stroke-[oklch(0.55_0.07_150_/_0.2)] dark:stroke-[oklch(0.68_0.06_155_/_0.18)]"
        />
        <path
          d="M -30 430 C 70 350, 150 520, 250 430 S 390 340, 450 410"
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          className="stroke-[oklch(0.5_0.07_122_/_0.22)] dark:stroke-[oklch(0.7_0.05_128_/_0.18)]"
        />
        <circle
          cx="318"
          cy="690"
          r="64"
          fill="none"
          strokeWidth="10"
          className="stroke-[oklch(0.5_0.07_130_/_0.24)] dark:stroke-[oklch(0.7_0.05_136_/_0.2)]"
        />
        <circle
          cx="356"
          cy="718"
          r="102"
          fill="none"
          strokeWidth="5"
          className="stroke-[oklch(0.54_0.05_142_/_0.18)] dark:stroke-[oklch(0.72_0.05_145_/_0.16)]"
        />
        <circle
          cx="292"
          cy="168"
          r="26"
          className="fill-[oklch(0.55_0.08_132_/_0.22)] dark:fill-[oklch(0.62_0.06_140_/_0.2)]"
        />
        <circle
          cx="92"
          cy="610"
          r="16"
          className="fill-[oklch(0.52_0.06_150_/_0.2)] dark:fill-[oklch(0.66_0.05_155_/_0.18)]"
        />
      </svg>
    </>
  );
}

function TrainingBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-38deg,oklch(0.45_0.1_40_/_0.1)_0_1.25px,transparent_1.25px_22px)] dark:bg-[repeating-linear-gradient(-38deg,oklch(0.78_0.1_40_/_0.1)_0_1.25px,transparent_1.25px_22px)]" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full motion-safe:animate-train-slash"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <polygon
          points="296,0 400,0 400,68"
          className="fill-[oklch(0.45_0.16_32_/_0.32)] dark:fill-[oklch(0.5_0.14_32_/_0.3)]"
        />
        <polygon
          points="400,40 400,250 372,800 400,800"
          className="fill-[oklch(0.4_0.14_28_/_0.28)] dark:fill-[oklch(0.42_0.12_28_/_0.28)]"
        />
        <polygon
          points="0,692 40,800 0,800"
          className="fill-[oklch(0.44_0.14_34_/_0.26)] dark:fill-[oklch(0.48_0.12_34_/_0.24)]"
        />
        <polygon
          points="16,468 176,214 183,224 23,478"
          className="fill-[oklch(0.4_0.14_30_/_0.28)] dark:fill-[oklch(0.62_0.12_30_/_0.24)]"
        />
        <polygon
          points="198,736 354,472 361,483 205,747"
          className="fill-[oklch(0.42_0.12_34_/_0.22)] dark:fill-[oklch(0.66_0.1_34_/_0.2)]"
        />
      </svg>
    </>
  );
}
