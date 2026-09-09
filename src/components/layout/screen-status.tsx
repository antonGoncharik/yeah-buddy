"use client";

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
import { cn } from "@/lib/utils";

const BEATS = [
  { key: "cookie", mark: <CookieMark />, viewBox: COOKIE_VIEWBOX },
  { key: "mug", mark: <MugMark />, viewBox: MUG_VIEWBOX },
  { key: "dumbbell", mark: <DumbbellMark />, viewBox: DUMBBELL_VIEWBOX },
  { key: "barbell", mark: <BarbellMark />, viewBox: BARBELL_VIEWBOX },
] as const;

export function ScreenLoading() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
    >
      <div className="flex items-center gap-3.5 text-muted-foreground">
        {BEATS.map((item, index) => (
          <span
            key={item.key}
            className={cn(
              "animate-loader-beat block",
              item.key === "mug" && "-ml-2",
              item.key === "dumbbell" && "-ml-2.5",
            )}
            style={{ animationDelay: `${index * 0.22}s` }}
          >
            <Doodle className="size-16" viewBox={item.viewBox}>
              {item.mark}
            </Doodle>
          </span>
        ))}
      </div>
      <span className="sr-only">Загрузка</span>
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
