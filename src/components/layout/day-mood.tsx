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
          "absolute inset-0 transition-opacity duration-500 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          mood === "rest" ? "opacity-100" : "opacity-0",
        )}
      >
        <RestBackdrop />
      </div>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
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
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.48_0.07_165_/_0.14)_1.2px,transparent_1.2px)] bg-size-[22px_22px] dark:bg-[radial-gradient(oklch(0.72_0.06_175_/_0.16)_1.2px,transparent_1.2px)]" />
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
          className="fill-[oklch(0.78_0.08_165_/_0.5)] dark:fill-[oklch(0.38_0.07_175_/_0.42)]"
        />
        <circle
          cx="340"
          cy="520"
          r="200"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.82_0.06_200_/_0.38)] dark:fill-[oklch(0.4_0.06_210_/_0.32)]"
        />
        <ellipse
          cx="200"
          cy="780"
          rx="240"
          ry="140"
          filter="url(#rest-soft)"
          className="fill-[oklch(0.86_0.05_145_/_0.36)] dark:fill-[oklch(0.36_0.05_160_/_0.28)]"
        />
        <circle
          cx="48"
          cy="90"
          r="72"
          fill="none"
          strokeWidth="14"
          className="stroke-[oklch(0.52_0.11_165_/_0.38)] dark:stroke-[oklch(0.7_0.08_175_/_0.32)]"
        />
        <circle
          cx="48"
          cy="90"
          r="118"
          fill="none"
          strokeWidth="7"
          className="stroke-[oklch(0.55_0.09_175_/_0.28)] dark:stroke-[oklch(0.72_0.07_185_/_0.24)]"
        />
        <circle
          cx="48"
          cy="90"
          r="162"
          fill="none"
          strokeWidth="3"
          className="stroke-[oklch(0.5_0.08_155_/_0.22)] dark:stroke-[oklch(0.74_0.06_170_/_0.2)]"
        />
        <path
          d="M 430 160 A 170 170 0 0 0 430 620"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className="stroke-[oklch(0.58_0.1_200_/_0.28)] dark:stroke-[oklch(0.68_0.08_205_/_0.26)]"
        />
        <path
          d="M -30 430 C 70 350, 150 520, 250 430 S 390 340, 450 410"
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          className="stroke-[oklch(0.5_0.1_150_/_0.3)] dark:stroke-[oklch(0.7_0.08_160_/_0.26)]"
        />
        <circle
          cx="318"
          cy="690"
          r="64"
          fill="none"
          strokeWidth="10"
          className="stroke-[oklch(0.52_0.1_160_/_0.34)] dark:stroke-[oklch(0.7_0.08_170_/_0.28)]"
        />
        <circle
          cx="356"
          cy="718"
          r="102"
          fill="none"
          strokeWidth="5"
          className="stroke-[oklch(0.56_0.08_180_/_0.26)] dark:stroke-[oklch(0.72_0.07_185_/_0.22)]"
        />
        <circle
          cx="292"
          cy="168"
          r="26"
          className="fill-[oklch(0.58_0.12_165_/_0.32)] dark:fill-[oklch(0.62_0.09_175_/_0.28)]"
        />
        <circle
          cx="92"
          cy="610"
          r="16"
          className="fill-[oklch(0.55_0.1_200_/_0.28)] dark:fill-[oklch(0.66_0.08_205_/_0.24)]"
        />
      </svg>
    </>
  );
}

function TrainingBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-38deg,oklch(0.38_0.24_24_/_0.34)_0_1.5px,transparent_1.5px_9px)] dark:bg-[repeating-linear-gradient(-38deg,oklch(0.78_0.2_24_/_0.34)_0_1.5px,transparent_1.5px_9px)]" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full motion-safe:animate-train-slash"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <polygon
          points="296,0 400,0 400,68"
          className="fill-[oklch(0.42_0.24_26_/_0.58)] dark:fill-[oklch(0.52_0.2_26_/_0.52)]"
        />
        <polygon
          points="400,40 400,250 372,800 400,800"
          className="fill-[oklch(0.36_0.22_20_/_0.5)] dark:fill-[oklch(0.42_0.18_20_/_0.48)]"
        />
        <polygon
          points="0,692 40,800 0,800"
          className="fill-[oklch(0.4_0.21_30_/_0.46)] dark:fill-[oklch(0.48_0.17_30_/_0.44)]"
        />
        <polygon
          points="0,0 26,0 0,34"
          className="fill-[oklch(0.44_0.22_24_/_0.42)] dark:fill-[oklch(0.5_0.18_24_/_0.4)]"
        />
        <polygon
          points="16,468 176,214 183,224 23,478"
          className="fill-[oklch(0.34_0.22_20_/_0.5)] dark:fill-[oklch(0.66_0.18_20_/_0.44)]"
        />
        <polygon
          points="198,736 354,472 361,483 205,747"
          className="fill-[oklch(0.36_0.2_26_/_0.42)] dark:fill-[oklch(0.68_0.16_26_/_0.38)]"
        />
        <polygon
          points="68,800 218,584 224,594 74,800"
          className="fill-[oklch(0.32_0.2_22_/_0.38)] dark:fill-[oklch(0.72_0.15_22_/_0.34)]"
        />
      </svg>
    </>
  );
}
