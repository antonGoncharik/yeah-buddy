"use client";

import { ProgramPresetList } from "@/components/workout/program-preset-list";
import type { ProgramPresetId } from "@/lib/workout/program-presets";

export function ScheduleProgramsSection({
  saving,
  onPick,
}: {
  saving: boolean;
  onPick: (presetId: ProgramPresetId) => void;
}) {
  return (
    <section className="animate-rise flex flex-col gap-2">
      <h2 className="px-1 text-lg font-semibold">Программы</h2>
      <p className="px-1 text-sm leading-relaxed text-muted-foreground">
        Поставь в очередь. Свои отложатся.
      </p>
      <ProgramPresetList disabled={saving} onPick={onPick} />
    </section>
  );
}
