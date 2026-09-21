"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { formatBodyWeight, parseBodyWeight } from "@/lib/day/body-weight";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import { parseDecimal } from "@/lib/workout/numbers";

export function BodyWeightField({
  value,
  placeholder,
  readOnly = false,
  disabled = false,
  onSave,
}: {
  value: number | null;
  placeholder?: number | null;
  readOnly?: boolean;
  disabled?: boolean;
  onSave?: (value: number | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() =>
    value == null ? "" : formatBodyWeight(value),
  );

  useEffect(() => {
    setDraft(value == null ? "" : formatBodyWeight(value));
  }, [value]);

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
        {formatBodyWeight(value)}
        <span className="ml-1 text-lg font-medium text-muted-foreground">
          кг
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

    const parsed = parseBodyWeight(parseDecimal(trimmed));
    if (parsed == null) {
      haptic("warn");
      setDraft(value == null ? "" : formatBodyWeight(value));
      return;
    }

    if (parsed === value) {
      setDraft(formatBodyWeight(parsed));
      return;
    }

    setDraft(formatBodyWeight(parsed));
    haptic("commit");
    void onSave(parsed);
  }

  return (
    <div className="flex items-baseline justify-end gap-1">
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label="Вес тела"
        disabled={disabled}
        value={draft}
        placeholder={placeholder != null ? formatBodyWeight(placeholder) : "—"}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "h-8 w-[4.5rem] rounded-lg px-2 text-right text-xl font-semibold tabular-nums md:text-xl",
        )}
      />
      <span className="text-lg font-medium text-muted-foreground">кг</span>
    </div>
  );
}
