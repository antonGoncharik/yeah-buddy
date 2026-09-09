"use client";

import {
  BarbellMark,
  CookieMark,
  Doodle,
  DumbbellMark,
  MugMark,
} from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";

const BEATS = [
  { key: "cookie", mark: <CookieMark /> },
  { key: "mug", mark: <MugMark /> },
  { key: "dumbbell", mark: <DumbbellMark /> },
  { key: "barbell", mark: <BarbellMark /> },
] as const;

export function ScreenLoading() {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className="flex justify-center py-12"
    >
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {BEATS.map((item, index) => (
          <span
            key={item.key}
            className="animate-loader-beat block"
            style={{ animationDelay: `${index * 0.22}s` }}
          >
            <Doodle className="size-9">{item.mark}</Doodle>
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
