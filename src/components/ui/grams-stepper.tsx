"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { stepYieldGrams } from "@/lib/food/yield";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function GramsStepperInput({
  value,
  onChange,
  size = "lg",
  inputClassName,
  "aria-label": ariaLabel = "Граммы",
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  inputClassName?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const large = size === "lg";
  const small = size === "sm";

  function step(direction: -1 | 1) {
    haptic("tick");
    onChange(stepYieldGrams(value, direction));
  }

  return (
    <div className="flex items-center gap-2">
      <GramStep label="Меньше" large={large} small={small} onClick={() => step(-1)}>
        <Minus className={large ? "size-5" : small ? "size-3.5" : "size-4"} />
      </GramStep>
      <Input
        inputMode="decimal"
        enterKeyHint="done"
        value={value}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleNumericEnter}
        className={cn(
          "min-w-0 flex-1 px-2 text-center font-semibold tabular-nums",
          large
            ? "h-14 text-2xl"
            : small
              ? "h-10 text-base"
              : "h-12 text-base",
          inputClassName,
        )}
      />
      <GramStep label="Больше" large={large} small={small} onClick={() => step(1)}>
        <Plus className={large ? "size-5" : small ? "size-3.5" : "size-4"} />
      </GramStep>
    </div>
  );
}

function GramStep({
  label,
  large,
  small,
  onClick,
  children,
}: {
  label: string;
  large: boolean;
  small: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-muted/60",
        large ? "size-14" : small ? "size-10" : "size-12",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
