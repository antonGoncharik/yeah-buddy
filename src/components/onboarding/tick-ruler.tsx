"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

const ITEM_WIDTH_PX = 14;

export function readRulerValue(
  scrollLeft: number,
  itemWidth: number,
  min: number,
  max: number,
): number {
  if (itemWidth <= 0 || max < min) {
    return min;
  }
  const index = Math.round(scrollLeft / itemWidth);
  const last = max - min;
  const clamped = Math.min(Math.max(index, 0), last);
  return min + clamped;
}

export function TickRuler({
  label,
  min,
  max,
  value,
  onChange,
  unit,
  ariaLabel,
  invalid = false,
  compact = false,
}: {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  unit: string | ((value: number) => string);
  ariaLabel: string;
  invalid?: boolean;
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const placedRef = useRef(false);
  const gestureStartRef = useRef<number | null>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef(value);
  const suppressRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [display, setDisplay] = useState(value);

  const safeMax = Math.max(min, max);
  const unitText = typeof unit === "string" ? unit : unit(display);
  const edgePadding =
    containerWidth > 0 ? containerWidth / 2 - ITEM_WIDTH_PX / 2 : 0;
  const ticks = Array.from(
    { length: safeMax - min + 1 },
    (_, index) => min + index,
  );

  const read = useCallback((): number => {
    const el = scrollRef.current;
    if (!el) {
      return min;
    }
    return readRulerValue(el.scrollLeft, ITEM_WIDTH_PX, min, safeMax);
  }, [min, safeMax]);

  const scrollTo = useCallback(
    (next: number, behavior: ScrollBehavior) => {
      const el = scrollRef.current;
      if (!el) {
        return;
      }
      suppressRef.current = true;
      el.scrollTo({ left: (next - min) * ITEM_WIDTH_PX, behavior });
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 50);
    },
    [min],
  );

  const publish = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, min), safeMax);
      setDisplay(clamped);
      if (lastEmittedRef.current === clamped) {
        return;
      }
      lastEmittedRef.current = clamped;
      onChange(clamped);
    },
    [min, onChange, safeMax],
  );

  const finishScroll = useCallback(() => {
    if (suppressRef.current) {
      return;
    }
    const wasUser = userScrollingRef.current;
    userScrollingRef.current = false;
    const next = read();
    const start = gestureStartRef.current;
    gestureStartRef.current = null;
    publish(next);
    if (wasUser && start != null && start !== next) {
      haptic("tick");
    }
  }, [publish, read]);

  const scheduleFinish = useCallback(() => {
    if (scrollEndTimerRef.current != null) {
      clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = setTimeout(() => finishScroll(), 80);
  }, [finishScroll]);

  const nudge = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(display + delta, min), safeMax);
      if (next === display) {
        return;
      }
      userScrollingRef.current = false;
      gestureStartRef.current = null;
      scrollTo(next, "auto");
      if (lastEmittedRef.current !== next) {
        lastEmittedRef.current = next;
        haptic("tick");
        onChange(next);
      }
      setDisplay(next);
    },
    [display, min, onChange, safeMax, scrollTo],
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
  }, []);

  useEffect(() => {
    if (containerWidth === 0 || userScrollingRef.current) {
      return;
    }
    if (!placedRef.current) {
      scrollTo(value, "auto");
      lastEmittedRef.current = value;
      placedRef.current = true;
      setDisplay(value);
      return;
    }
    if (lastEmittedRef.current === value) {
      return;
    }
    scrollTo(value, "auto");
    lastEmittedRef.current = value;
    setDisplay(value);
  }, [containerWidth, scrollTo, value]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const onScrollEnd = () => finishScroll();
    el.addEventListener("scrollend", onScrollEnd);
    return () => el.removeEventListener("scrollend", onScrollEnd);
  }, [finishScroll]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current != null) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <p className="text-center text-sm font-medium text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
        <div
          className={cn(
            "flex items-baseline justify-center gap-2 tabular-nums",
            invalid && "text-destructive",
          )}
          aria-live="polite"
        >
          <span className="text-5xl font-semibold tracking-tight">
            {display}
          </span>
          <span className="text-lg text-muted-foreground">{unitText}</span>
        </div>

        <div className={cn("relative w-full", compact ? "h-16" : "h-24")}>
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2"
            aria-hidden
          >
            <div
              className={cn(
                "mx-auto w-0.5 rounded-full bg-foreground",
                compact ? "h-12" : "h-16",
              )}
            />
          </div>

          <div
            ref={scrollRef}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={safeMax}
            aria-valuenow={display}
            aria-valuetext={`${display} ${unitText}`}
            aria-invalid={invalid || undefined}
            tabIndex={0}
            className="h-full w-full touch-pan-x overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
            onScroll={() => {
              if (suppressRef.current) {
                return;
              }
              if (gestureStartRef.current == null) {
                gestureStartRef.current = lastEmittedRef.current;
              }
              userScrollingRef.current = true;
              publish(read());
              scheduleFinish();
            }}
            onPointerDown={() => {
              userScrollingRef.current = true;
              if (gestureStartRef.current == null) {
                gestureStartRef.current = lastEmittedRef.current;
              }
            }}
            onPointerUp={scheduleFinish}
            onPointerCancel={finishScroll}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                nudge(-1);
              }
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                nudge(1);
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
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="flex h-full shrink-0 items-center justify-center"
                  style={{
                    width: ITEM_WIDTH_PX,
                    scrollSnapAlign: "center",
                  }}
                >
                  <div
                    className={cn(
                      "w-0.5 rounded-full bg-foreground",
                      tick % 10 === 0
                        ? "h-10 opacity-80"
                        : tick % 5 === 0
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
    </div>
  );
}
