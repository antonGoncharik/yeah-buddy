"use client";

import { Button } from "@/components/ui/button";

export function RemainingRecipeAction({
  remainingLine,
  fullGap,
  viewOnly,
  busy,
  onFill,
}: {
  remainingLine: string | null;
  fullGap: boolean;
  viewOnly: boolean;
  busy: boolean;
  onFill: () => void;
}) {
  if (!remainingLine) {
    return null;
  }

  if (viewOnly) {
    return (
      <p className="px-1 text-base leading-relaxed text-muted-foreground">
        {remainingLine}
      </p>
    );
  }

  if (fullGap) {
    return (
      <Button
        type="button"
        className="h-14 w-full text-lg"
        disabled={busy}
        onClick={onFill}
      >
        Подставить из шаблона
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="block h-auto min-h-12 w-full min-w-0 px-4 py-3 text-left text-base font-medium leading-snug whitespace-normal"
      disabled={busy}
      onClick={onFill}
    >
      <span className="block min-w-0">{remainingLine}</span>
    </Button>
  );
}
