"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { OnboardingSex } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import { parseDecimal } from "@/lib/workout/numbers";

export const ONBOARDING_WEIGHT_MIN_KG = 30;
export const ONBOARDING_WEIGHT_MAX_KG = 250;
export const ONBOARDING_WEIGHT_DEFAULT_MALE_KG = 80;
export const ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG = 60;

/** @deprecated Use `onboardingDefaultWeightKg`. */
export const ONBOARDING_WEIGHT_DEFAULT_KG = ONBOARDING_WEIGHT_DEFAULT_MALE_KG;

export function onboardingDefaultWeightKg(sex: OnboardingSex | null): number {
  if (sex === "female") {
    return ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG;
  }
  if (sex === "male") {
    return ONBOARDING_WEIGHT_DEFAULT_MALE_KG;
  }
  return ONBOARDING_WEIGHT_DEFAULT_MALE_KG;
}

export function isOnboardingPresetWeightKg(kg: number): boolean {
  return (
    kg === ONBOARDING_WEIGHT_DEFAULT_MALE_KG ||
    kg === ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG ||
    kg === 65
  );
}
const ITEM_WIDTH_PX = 14;

const WEIGHTS = Array.from(
  { length: ONBOARDING_WEIGHT_MAX_KG - ONBOARDING_WEIGHT_MIN_KG + 1 },
  (_, index) => ONBOARDING_WEIGHT_MIN_KG + index,
);

export function onboardingWeightKgFromDraft(
  raw: string,
  sex: OnboardingSex | null = null,
): number {
  const parsed = parseDecimal(raw);
  if (
    parsed != null &&
    parsed >= ONBOARDING_WEIGHT_MIN_KG &&
    parsed <= ONBOARDING_WEIGHT_MAX_KG
  ) {
    return Math.round(parsed);
  }
  return onboardingDefaultWeightKg(sex);
}

export function OnboardingWeightRuler({
  sex,
  weight,
  invalid,
  onChange,
}: {
  sex: OnboardingSex;
  weight: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedKgRef = useRef<number | null>(null);
  const suppressScrollEmitRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayKg, setDisplayKg] = useState(() =>
    onboardingWeightKgFromDraft(weight, sex),
  );

  const edgePadding =
    containerWidth > 0 ? containerWidth / 2 - ITEM_WIDTH_PX / 2 : 0;

  const readKgFromScroll = useCallback((): number => {
    const el = scrollRef.current;
    if (!el) {
      return onboardingDefaultWeightKg(sex);
    }
    const index = Math.round(el.scrollLeft / ITEM_WIDTH_PX);
    const clamped = Math.min(Math.max(index, 0), WEIGHTS.length - 1);
    return ONBOARDING_WEIGHT_MIN_KG + clamped;
  }, [sex]);

  const scrollToKg = useCallback((kg: number, behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    suppressScrollEmitRef.current = true;
    const index = kg - ONBOARDING_WEIGHT_MIN_KG;
    el.scrollTo({ left: index * ITEM_WIDTH_PX, behavior });
    lastEmittedKgRef.current = kg;
    setDisplayKg(kg);
    window.setTimeout(() => {
      suppressScrollEmitRef.current = false;
    }, 50);
  }, []);

  const commitKg = useCallback(
    (kg: number) => {
      if (lastEmittedKgRef.current === kg) {
        return;
      }
      lastEmittedKgRef.current = kg;
      setDisplayKg(kg);
      haptic("tick");
      onChange(String(kg));
    },
    [onChange],
  );

  const finishScroll = useCallback(() => {
    userScrollingRef.current = false;
    if (suppressScrollEmitRef.current) {
      return;
    }
    const kg = readKgFromScroll();
    commitKg(kg);
  }, [commitKg, readKgFromScroll]);

  const onScrollLive = useCallback(() => {
    if (suppressScrollEmitRef.current) {
      return;
    }
    setDisplayKg(readKgFromScroll());
  }, [readKgFromScroll]);

  const nudgeKg = useCallback(
    (delta: number) => {
      const next = Math.min(
        Math.max(displayKg + delta, ONBOARDING_WEIGHT_MIN_KG),
        ONBOARDING_WEIGHT_MAX_KG,
      );
      if (next === displayKg) {
        return;
      }
      scrollToKg(next, "auto");
      commitKg(next);
    },
    [commitKg, displayKg, scrollToKg],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [sex]);

  useEffect(() => {
    if (weight.trim() === "") {
      onChange(String(onboardingDefaultWeightKg(sex)));
    }
  }, [onChange, sex, weight]);

  useEffect(() => {
    if (containerWidth === 0 || userScrollingRef.current) {
      return;
    }
    const kg = onboardingWeightKgFromDraft(weight, sex);
    if (kg === readKgFromScroll()) {
      setDisplayKg(kg);
      lastEmittedKgRef.current = kg;
      return;
    }
    scrollToKg(kg, "auto");
  }, [containerWidth, readKgFromScroll, scrollToKg, sex, weight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const onScrollEnd = () => finishScroll();
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [finishScroll]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-baseline justify-center gap-2 tabular-nums",
          invalid && "text-destructive",
        )}
        aria-live="polite"
      >
        <span className="text-5xl font-semibold tracking-tight">
          {displayKg}
        </span>
        <span className="text-lg text-muted-foreground">кг</span>
      </div>

      <div className="relative h-24 w-full">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2"
          aria-hidden
        >
          <div className="mx-auto h-16 w-0.5 rounded-full bg-foreground" />
        </div>

        <div
          ref={scrollRef}
          role="slider"
          aria-label="Вес тела"
          aria-valuemin={ONBOARDING_WEIGHT_MIN_KG}
          aria-valuemax={ONBOARDING_WEIGHT_MAX_KG}
          aria-valuenow={displayKg}
          aria-invalid={invalid || undefined}
          tabIndex={0}
          className="h-full w-full overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
          onScroll={onScrollLive}
          onPointerDown={() => {
            userScrollingRef.current = true;
          }}
          onPointerUp={() => {
            if (scrollEndTimerRef.current != null) {
              clearTimeout(scrollEndTimerRef.current);
            }
            scrollEndTimerRef.current = setTimeout(() => finishScroll(), 80);
          }}
          onPointerCancel={() => {
            userScrollingRef.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              nudgeKg(-1);
            }
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              nudgeKg(1);
            }
          }}
        >
          <div
            className="flex h-full items-center"
            style={{
              paddingLeft: edgePadding,
              paddingRight: edgePadding,
            }}
          >
            {WEIGHTS.map((kg) => (
              <div
                key={kg}
                className="flex h-full shrink-0 items-center justify-center"
                style={{
                  width: ITEM_WIDTH_PX,
                  scrollSnapAlign: "center",
                }}
              >
                <div
                  className={cn(
                    "w-0.5 rounded-full bg-foreground",
                    kg % 10 === 0
                      ? "h-10 opacity-80"
                      : kg % 5 === 0
                        ? "h-7 opacity-50"
                        : "h-4 opacity-30",
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
