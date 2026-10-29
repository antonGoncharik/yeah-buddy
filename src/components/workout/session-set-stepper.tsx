"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import {
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
} from "@/lib/form/numeric-draft";

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SessionSetStepper({
  label,
  value,
  disabled,
  inputMode,
  enterKeyHint,
  onChange,
  onStep,
}: {
  label: string;
  value: string;
  disabled: boolean;
  inputMode: "decimal" | "numeric";
  enterKeyHint: "next" | "done";
  onChange: (value: string) => void;
  onStep: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <StepButton
          label={`Меньше, ${label}`}
          disabled={disabled}
          onClick={() => onStep(-1)}
        >
          <Minus className="size-5" />
        </StepButton>
        <Input
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              inputMode === "numeric"
                ? sanitizeIntegerDraft(event.target.value)
                : sanitizeDecimalDraft(event.target.value),
            )
          }
          onKeyDown={handleNumericEnter}
          className="h-12 min-w-0 flex-1 px-2 text-center text-xl font-semibold tabular-nums"
          aria-label={label}
        />
        <StepButton
          label={`Больше, ${label}`}
          disabled={disabled}
          onClick={() => onStep(1)}
        >
          <Plus className="size-5" />
        </StepButton>
      </div>
    </div>
  );
}
