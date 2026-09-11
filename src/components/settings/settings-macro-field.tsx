"use client";

import { parseMacro } from "@/components/settings/settings-form-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKcal } from "@/lib/nutrition";

export function SettingsMacroField({
  label,
  value,
  kcalPerGram,
  onChange,
}: {
  label: string;
  value: string;
  kcalPerGram: number;
  onChange: (value: string) => void;
}) {
  const grams = parseMacro(value);
  const kcal = grams == null ? null : grams * kcalPerGram;

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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 text-base"
      />
    </div>
  );
}
