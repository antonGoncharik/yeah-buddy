"use client";

import { Segmented } from "@/components/ui/segmented";
import type { GramsMode } from "@/lib/food/yield";

export function GramsYieldToggle({
  mode,
  nativeLabel,
  equivalentLabel,
  disabled,
  onChange,
}: {
  mode: GramsMode;
  nativeLabel: string;
  equivalentLabel: string;
  disabled?: boolean;
  onChange: (mode: GramsMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Segmented
        value={mode}
        options={[
          { id: "native" as const, label: nativeLabel },
          { id: "cooked" as const, label: "Готовое" },
        ]}
        disabled={disabled}
        onChange={onChange}
      />
      <p className="text-sm text-muted-foreground">{equivalentLabel}</p>
    </div>
  );
}
