"use client";

import { Button } from "@/components/ui/button";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import type { CyclePhaseDef } from "@/lib/types";

export function FormulaCycleTemplateSection({
  hasCycle,
  onApply,
  onCustom,
  onDismiss,
}: {
  hasCycle: boolean;
  onApply: (
    cycle: CyclePhaseDef[],
    name: string,
    extra?: { auto_end?: boolean; loop?: boolean },
  ) => void;
  onCustom?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">
        {hasCycle ? "Другая схема" : "Выбрать схему"}
      </h2>
      <FormulaCycleTemplates
        onApply={onApply}
        onCustom={hasCycle ? undefined : onCustom}
      />
      {hasCycle && onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-base"
          onClick={onDismiss}
        >
          Оставить как есть
        </Button>
      ) : null}
    </section>
  );
}
