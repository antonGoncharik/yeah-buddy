"use client";

import { Button } from "@/components/ui/button";
import type { CyclePhaseDef } from "@/lib/types";
import { CYCLE_TEMPLATES } from "@/lib/workout/default-formulas";

export function FormulaCycleTemplates({
  onApply,
  onCustom,
  disabled,
}: {
  onApply: (
    cycle: CyclePhaseDef[],
    name: string,
    extra?: { auto_end?: boolean; loop?: boolean },
  ) => void;
  /** Start from a blank phase instead of a template; hidden when absent. */
  onCustom?: () => void;
  disabled?: boolean;
}) {
  const weeks = CYCLE_TEMPLATES.filter((template) => !template.scheme);
  const schemes = CYCLE_TEMPLATES.filter((template) => template.scheme);

  return (
    <>
      {weeks.map((template) => (
        <CycleTemplateButton
          key={template.id}
          name={template.name}
          hint={template.hint}
          disabled={disabled}
          onPick={() =>
            onApply(template.cycle, template.name, {
              auto_end: template.auto_end,
              loop: template.loop,
            })
          }
        />
      ))}
      <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
        Ниже меняются подходы, не только вес. В днях со своей схемой не
        ставится.
      </p>
      {schemes.map((template) => (
        <CycleTemplateButton
          key={template.id}
          name={template.name}
          hint={template.hint}
          disabled={disabled}
          onPick={() =>
            onApply(template.cycle, template.name, {
              auto_end: template.auto_end,
              loop: template.loop,
            })
          }
        />
      ))}
      {onCustom ? (
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={disabled}
          onClick={onCustom}
        >
          Собрать свои этапы
        </Button>
      ) : null}
    </>
  );
}

function CycleTemplateButton({
  name,
  hint,
  disabled,
  onPick,
}: {
  name: string;
  hint: string;
  disabled?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      onClick={onPick}
    >
      <p className="text-base font-medium">{name}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </button>
  );
}
