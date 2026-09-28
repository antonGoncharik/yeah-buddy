"use client";

import { SectionHeading } from "@/components/layout/section-heading";
import { ProgramPresetCatalog } from "@/components/workout/program-preset-list";
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
        hint="Заменит текущий список. На карточке — сколько разных тренировок и как часто обычно ходят; это не расписание на понедельник и среду. Твои дни отложатся."
      />
      <ProgramPresetCatalog disabled={saving} onPick={onPick} />
    </section>
  );
}
