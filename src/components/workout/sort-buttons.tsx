"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SortButtons({
  disableUp,
  disableDown,
  disabled,
  onUp,
  onDown,
}: {
  disableUp: boolean;
  disableDown: boolean;
  disabled?: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11"
        disabled={disabled || disableUp}
        aria-label="Выше"
        onClick={onUp}
      >
        <ChevronUp className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11"
        disabled={disabled || disableDown}
        aria-label="Ниже"
        onClick={onDown}
      >
        <ChevronDown className="size-5" />
      </Button>
    </div>
  );
}
