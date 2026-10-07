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
        hint="Заменит текущий список. После постановки дни и упражнения можно менять — очередь пойдёт по твоей версии. На карточке — сколько тренировок и как часто обычно ходят; это не пн/ср/пт. Твои дни отложатся."
      />
      <ProgramPresetCatalog disabled={saving} onPick={onPick} />
    </section>
  );
}
