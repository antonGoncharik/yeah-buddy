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

export function ScreenLoading({ title }: { title?: string }) {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        {title ? (
          <p className="animate-fade text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          {BEATS.map((item, index) => (
            <span
              key={item.key}
              className={cn(
                "animate-loader-beat block",
                "pull" in item && item.pull,
              )}
              style={{ animationDelay: `${index * 0.22}s` }}
            >
              <Doodle className={item.box} viewBox={item.viewBox}>
                {item.mark}
              </Doodle>
            </span>
          ))}
        </div>
        <p aria-hidden className="animate-fade text-base">
          Загрузка углеводами…
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
