"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { formatBodyWeight, parseBodyWeight } from "@/lib/day/body-weight";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import { parseDecimal } from "@/lib/workout/numbers";

export function BodyWeightField({
  value,
  placeholder,
  readOnly = false,
  disabled = false,
  onSave,
  unit = "кг",
  ariaLabel = "Вес тела",
  invalidHint = "Вес от 20 до 400 кг.",
  align = "end",
  format = formatBodyWeight,
  parse = parseBodyWeight,
}: {
  value: number | null;
  placeholder?: number | null;
  readOnly?: boolean;
  disabled?: boolean;
  onSave?: (value: number | null) => Promise<void>;
  unit?: string;
  ariaLabel?: string;
  invalidHint?: string;
  align?: "start" | "end";
  format?: (value: number) => string;
  parse?: (value: number | null) => number | null;
}) {
  const [draft, setDraft] = useState(() =>
    value == null ? "" : format(value),
  );
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value == null ? "" : format(value));
    setInvalid(false);
  }, [format, value]);

  if (readOnly || !onSave) {
    if (value == null) {
      return (
        <p className="text-xl font-semibold tabular-nums text-muted-foreground">
          —
        </p>
      );
    }

    return (
      <p className="text-xl font-semibold tracking-tight tabular-nums">
        {format(value)}
        <span className="ml-1 text-lg font-medium text-muted-foreground">
          {unit}
        </span>
      </p>
    );
  }

  async function commit() {
    if (!onSave || disabled) {
      return;
    }

    const trimmed = draft.trim();
    if (trimmed === "") {
      if (value == null) {
        return;
      }
      haptic("commit");
      void onSave(null);
      return;
    }

    const parsed = parse(parseDecimal(trimmed));
    if (parsed == null) {
      haptic("warn");
      setInvalid(true);
      return;
    }

    setInvalid(false);
    if (parsed === value) {
      setDraft(format(parsed));
      return;
    }

    setDraft(format(parsed));
    haptic("commit");
    void onSave(parsed);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "start" ? "items-start" : "items-end",
      )}
    >
      <div
        className={cn(
          "flex items-baseline gap-1",
          align === "start" ? "justify-start" : "justify-end",
        )}
      >
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={draft}
          placeholder={placeholder != null ? format(placeholder) : "—"}
          onChange={(event) => {
            setDraft(sanitizeDecimalDraft(event.target.value));
            setInvalid(false);
          }}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className={cn(
            "h-8 w-[4.5rem] rounded-lg px-2 text-xl font-semibold tabular-nums md:text-xl",
            align === "start" ? "text-left" : "text-right",
          )}
        />
        <span className="text-lg font-medium text-muted-foreground">{unit}</span>
      </div>
      {invalid ? (
        <p className="text-xs text-destructive">{invalidHint}</p>
      ) : null}
    </div>
  );
}
