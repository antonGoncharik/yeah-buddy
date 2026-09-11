"use client";

import { Button } from "@/components/ui/button";
import type { CyclePhaseDef } from "@/lib/types";
import { CYCLE_TEMPLATES } from "@/lib/workout/default-formulas";

export function FormulaCycleTemplates({
  onApply,
  onCustom,
}: {
  onApply: (cycle: CyclePhaseDef[], name: string) => void;
  onCustom: () => void;
}) {
  return (
    <>
      {CYCLE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
          onClick={() => onApply(template.cycle, template.name)}
        >
          <p className="text-base font-medium">{template.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {template.hint}
          </p>
        </button>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        onClick={onCustom}
      >
        Свой цикл
      </Button>
    </>
  );
}
