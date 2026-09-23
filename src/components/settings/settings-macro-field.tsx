"use client";

import { parseMacro } from "@/components/settings/settings-form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { formatKcal } from "@/lib/nutrition";

export function SettingsMacroField({
  label,
  value,
  kcalPerGram,
  enterKeyHint = "next",
  onChange,
}: {
  label: string;
  value: string;
  kcalPerGram: number;
  enterKeyHint?: "next" | "done";
  onChange: (value: string) => void;
}) {
  const grams = parseMacro(value);
  const kcal = grams == null ? null : grams * kcalPerGram;
  const invalid = value.trim() !== "" && grams == null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-base">{label}</Label>
        {kcal != null ? (
          <p className="text-sm text-muted-foreground">
            {formatKcal(kcal)} ккал
          </p>
        ) : null}
      </div>
      <Input
        required
        inputMode="decimal"
        enterKeyHint={enterKeyHint}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) =>
          onChange(sanitizeDecimalDraft(event.target.value))
        }
        onKeyDown={handleNumericEnter}
        className="h-12 text-base"
      />
      {invalid ? (
        <p className="text-sm text-destructive">Число от 0 и выше.</p>
      ) : null}
    </div>
  );
}
