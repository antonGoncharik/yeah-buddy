"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { readWheelValue } from "@/lib/nutrition/body-profile";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

const VISIBLE_ROWS = 5;
const ROW_REM = 2.75;

export function ValueWheel({
  label,
  caption,
  values,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  caption: string | ((value: number) => string);
  values: readonly number[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  const min = values[0] ?? value;
  const count = values.length;
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const suppressRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef(value);
  const lastHapticRef = useRef(value);
  const dragRef = useRef(false);
  const startYRef = useRef(0);
  const rowPxRef = useRef(0);
  const [pad, setPad] = useState(0);
  const [display, setDisplay] = useState(value);

  const captionText = typeof caption === "string" ? caption : caption(display);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const row = el?.querySelector("button");
    if (!el || !row || userScrollingRef.current || count === 0) {
      return;
    }
    const rowPx = row.getBoundingClientRect().height;
    if (rowPx <= 0) {
      return;
    }
    rowPxRef.current = rowPx;
    const nextPad = Math.max(0, (el.clientHeight - rowPx) / 2);
    if (Math.abs(nextPad - pad) > 0.5) {
      setPad(nextPad);
      return;
    }
    setDisplay(value);
    const aligned = readWheelValue(el.scrollTop, rowPx, min, count);
    if (aligned === value) {
      return;
    }
    suppressRef.current = true;
    el.scrollTop = (value - min) * rowPx;
    const frame = window.requestAnimationFrame(() => {
      suppressRef.current = false;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      suppressRef.current = false;
    };
  }, [count, min, pad, value]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current != null) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  function finishScroll() {
    const scrolling = userScrollingRef.current;
    userScrollingRef.current = false;
    if (!scrolling || suppressRef.current) {
      return;
    }
    const el = scrollRef.current;
    if (!el || count === 0 || rowPxRef.current <= 0) {
      return;
    }
    const next = readWheelValue(el.scrollTop, rowPxRef.current, min, count);
    setDisplay(next);
    if (lastEmittedRef.current === next) {
      return;
    }
    lastEmittedRef.current = next;
    onChange(next);
  }

  function onScroll() {
    if (suppressRef.current || !userScrollingRef.current || count === 0) {
      return;
    }
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const next = readWheelValue(el.scrollTop, rowPxRef.current, min, count);
    setDisplay(next);
    if (lastHapticRef.current !== next) {
      lastHapticRef.current = next;
      haptic("tick");
    }
    if (scrollEndTimerRef.current != null) {
      clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = setTimeout(() => finishScroll(), 80);
  }

  function pick(next: number) {
    if (next === value) {
      return;
    }
    if (scrollEndTimerRef.current != null) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
    userScrollingRef.current = false;
    lastEmittedRef.current = next;
    lastHapticRef.current = next;
    haptic("tick");
    onChange(next);
  }

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <p className="text-base font-medium">{label}</p>
      <div
        className="relative w-full"
        style={{ height: `calc(${ROW_REM}rem * ${VISIBLE_ROWS})` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-1/2 h-11 -translate-y-1/2 rounded-2xl bg-foreground/10"
        />
        <div
          ref={scrollRef}
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={values[count - 1] ?? value}
          aria-valuenow={display}
          aria-valuetext={`${display} ${captionText}`}
          className="h-full w-full touch-pan-y overflow-y-auto overscroll-y-contain select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "y mandatory",
            maskImage:
              "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          }}
          onScroll={onScroll}
          onPointerDown={(event) => {
            userScrollingRef.current = true;
            dragRef.current = false;
            startYRef.current = event.clientY;
          }}
          onPointerMove={(event) => {
            if (Math.abs(event.clientY - startYRef.current) > 8) {
              dragRef.current = true;
            }
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
          onWheel={() => {
            userScrollingRef.current = true;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
              event.preventDefault();
              pick(Math.max(min, value - 1));
            }
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
              event.preventDefault();
              const max = min + count - 1;
              pick(Math.min(max, value + 1));
            }
          }}
        >
          <div
            className="flex flex-col"
            style={{
              paddingTop: pad,
              paddingBottom: pad,
            }}
          >
            {values.map((item) => {
              const distance = Math.abs(item - display);
              return (
                <button
                  key={item}
                  type="button"
                  tabIndex={-1}
                  className="flex h-11 w-full shrink-0 items-center justify-center bg-transparent"
                  style={{ scrollSnapAlign: "center" }}
                  onClick={() => {
                    if (dragRef.current) {
                      return;
                    }
                    pick(item);
                  }}
                >
                  <span
                    className={cn(
                      "tabular-nums leading-none",
                      distance === 0
                        ? "text-3xl font-semibold text-foreground"
                        : distance === 1
                          ? "text-xl text-foreground/70"
                          : "text-lg text-muted-foreground/70",
                    )}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{captionText}</p>
    </div>
  );
}
