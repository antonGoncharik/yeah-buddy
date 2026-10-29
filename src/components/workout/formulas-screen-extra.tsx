"use client";

import { Button } from "@/components/ui/button";
import { cycleHint, warmupsHint } from "@/components/workout/formula-form";
import { FormulasNavRow } from "@/components/workout/formulas-nav-row";
import type { WorkoutFormulas, WorkoutKind } from "@/lib/types";

export function FormulasScreenExtraNav({
  formulas,
  kind,
  hasCycle,
  dirty,
  saving,
  onSave,
  onRestoreDefaults,
}: {
  formulas: WorkoutFormulas;
  kind: WorkoutKind;
  hasCycle: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => Promise<boolean>;
  onRestoreDefaults: () => void | Promise<void>;
}) {
  return (
    <>
      <FormulasNavRow
        href="/settings/formulas/warmup"
        title="Разминка"
        hint={warmupsHint(formulas, kind)}
        dirty={dirty}
        busy={saving}
        onSave={onSave}
      />
      {hasCycle ? null : (
        <FormulasNavRow
          href="/settings/formulas/cycle"
          title="Недели"
          hint={cycleHint(formulas)}
          dirty={dirty}
          busy={saving}
          onSave={onSave}
        />
      )}
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base text-muted-foreground"
        disabled={saving}
        onClick={() => void onRestoreDefaults()}
      >
        Вернуть как было в начале
      </Button>
    </>
  );
}
