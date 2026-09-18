"use client";

import { useEffect, useRef, useState } from "react";

import { useBootSplash } from "@/components/layout/boot-splash";
import {
  BARBELL_VIEWBOX,
  BarbellMark,
  COOKIE_VIEWBOX,
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
  MUG_VIEWBOX,
  MugMark,
} from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import {
  LOADING_LINES,
  loadingFlavor,
  loadingLine,
  nightLoadingLine,
  SPLASH_BEAT_ORDER,
  SPLASH_HOLD_MS,
  type SplashBeat,
  splashBeatProgress,
  YEAH_BUDDY_LINE,
} from "@/lib/flavor";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

const BEATS = [
  {
    key: "mug",
    mark: <MugMark />,
    viewBox: MUG_VIEWBOX,
    box: "size-12",
  },
  {
    key: "dumbbell",
    mark: <DumbbellMark />,
    viewBox: DUMBBELL_VIEWBOX,
    box: "h-9 w-auto",
    pull: "-ml-1.5",
  },
  {
    key: "cookie",
    mark: <CookieMark />,
    viewBox: COOKIE_VIEWBOX,
    box: "size-12",
    pull: "-ml-1.5",
  },
  {
    key: "barbell",
    mark: <BarbellMark />,
    viewBox: BARBELL_VIEWBOX,
    box: "h-9 w-auto",
  },
] as const;

export function ScreenLoading({
  title,
  splash = false,
  cover = false,
}: {
  title?: string;
  splash?: boolean;
  cover?: boolean;
}) {
  const boot = useBootSplash();
  const flavor = loadingFlavor({ splash, title });
  const [line, setLine] = useState(LOADING_LINES[flavor][0] ?? "Загрузка…");
  const [splitTitle, setSplitTitle] = useState(false);
  const [beatStep, setBeatStep] = useState(0);
  const [beatLine, setBeatLine] = useState<string | null>(null);
  const holdRef = useRef<number | null>(null);

  useEffect(() => {
    if (splash || boot == null) {
      return;
    }
    return boot.hold();
  }, [boot, splash]);

  useEffect(() => {
    if (beatLine) {
      return;
    }
    setLine(
      flavor === "boot"
        ? (nightLoadingLine(Date.now()) ?? loadingLine(flavor, Date.now()))
        : loadingLine(flavor, Date.now()),
    );
  }, [beatLine, flavor]);

  useEffect(() => {
    return () => {
      if (holdRef.current != null) {
        window.clearTimeout(holdRef.current);
      }
    };
  }, []);

  function startHold() {
    if (!splash || splitTitle) {
      return;
    }
    if (holdRef.current != null) {
      window.clearTimeout(holdRef.current);
    }
    holdRef.current = window.setTimeout(() => {
      holdRef.current = null;
      setSplitTitle(true);
    }, SPLASH_HOLD_MS);
  }

  function endHold() {
    if (holdRef.current != null) {
      window.clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  }

  function tapBeat(key: SplashBeat) {
    if (!splash || beatLine) {
      return;
    }
    const next = splashBeatProgress(beatStep, key);
    setBeatStep(next);
    if (next >= SPLASH_BEAT_ORDER.length) {
      setBeatLine(YEAH_BUDDY_LINE);
      haptic("success");
      return;
    }
    haptic("tick");
  }

  if (!splash && boot?.active) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Загрузка"
      className={cn(
        "pointer-events-none fixed inset-0 z-20 flex items-center justify-center",
        cover && "bg-background/85",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-4 text-muted-foreground",
          cover && "text-foreground",
        )}
      >
        {title ? (
          <p
            className={cn(
              "animate-fade text-3xl font-semibold tracking-tight text-foreground",
              splash && "pointer-events-auto select-none",
            )}
            onPointerDown={splash ? startHold : undefined}
            onPointerUp={splash ? endHold : undefined}
            onPointerLeave={splash ? endHold : undefined}
            onPointerCancel={splash ? endHold : undefined}
          >
            {splash && splitTitle ? (
              <>
                <span className="block">Yeah.</span>
                <span className="block">Buddy.</span>
              </>
            ) : (
              title
            )}
          </p>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-2",
            splash && "pointer-events-auto",
          )}
          aria-hidden
        >
          {BEATS.map((item, index) => (
            <span
              key={item.key}
              className={cn(
                "animate-loader-beat block",
                splash && "cursor-pointer",
                item.key === "mug" && "doodle-mug",
                "pull" in item && item.pull,
              )}
              style={{ animationDelay: `${index * 0.22}s` }}
              onClick={splash ? () => tapBeat(item.key) : undefined}
            >
              <Doodle className={item.box} viewBox={item.viewBox}>
                {item.mark}
              </Doodle>
            </span>
          ))}
        </div>
        <p aria-hidden className="animate-fade text-base">
          {beatLine ?? line}
        </p>
      </div>
    </div>
  );
}

export function ScreenError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="animate-rise flex flex-col items-center gap-3 py-10">
      <p className="text-center text-lg font-medium">{message}</p>
      <Button className="h-12 min-w-40 text-base" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
