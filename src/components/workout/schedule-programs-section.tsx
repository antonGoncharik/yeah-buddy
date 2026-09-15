"use client";

import { SectionHeading } from "@/components/layout/section-heading";
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
      <SectionHeading
        title="Готовые программы"
        hint="Встанет как текущая программа. Свои дни отложатся, не пропадут."
      />
      <ProgramPresetList disabled={saving} onPick={onPick} />
    </section>
  );
}
