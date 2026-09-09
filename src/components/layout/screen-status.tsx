"use client";

import {
  BarbellMark,
  CookieMark,
  Doodle,
  DumbbellMark,
  ShakerMark,
} from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ORBIT = [
  {
    mark: <CookieMark />,
    className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  },
  {
    mark: <DumbbellMark />,
    className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
  },
  {
    mark: <ShakerMark />,
    className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  },
  {
    mark: <BarbellMark />,
    className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
  },
];

export function ScreenLoading() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="flex justify-center py-12"
    >
      <div className="relative size-28 text-muted-foreground">
        <div className="absolute inset-3 rounded-full border border-border/80" />
        <div className="absolute inset-0 animate-doodle-orbit">
          {ORBIT.map((item) => (
            <span
              key={item.className}
              className={cn("absolute", item.className)}
            >
              <span className="block animate-doodle-tumble">
                <Doodle className="size-9">{item.mark}</Doodle>
              </span>
            </span>
          ))}
        </div>
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
