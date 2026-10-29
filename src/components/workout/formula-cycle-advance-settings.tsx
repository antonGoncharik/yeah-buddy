"use client";

import type { Dispatch, SetStateAction } from "react";

import { Segmented } from "@/components/ui/segmented";
import type { WorkoutFormulas } from "@/lib/types";

export function FormulaCycleAdvanceSettings({
  formulas,
  setFormulas,
  setSaved,
}: {
  formulas: WorkoutFormulas;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <section className="card-surface flex flex-col gap-2 px-5 py-4">
      <h2 className="text-base font-medium">Когда менять этап</h2>
      <Segmented
        value={
          formulas.cycle_loop
            ? "loop"
            : formulas.cycle_auto_end
              ? "auto"
              : "manual"
        }
        options={[
          { id: "manual", label: "Сам" },
          { id: "auto", label: "После дней" },
          { id: "loop", label: "По кругу" },
        ]}
        onChange={(id) => {
          setSaved(false);
          setFormulas((current) =>
            current
              ? {
                  ...current,
                  cycle_auto_end: id === "manual" ? undefined : true,
                  cycle_loop: id === "loop" ? true : undefined,
                }
              : current,
          );
        }}
      />
      <p className="text-sm leading-snug text-muted-foreground">
        {formulas.cycle_loop
          ? "Прошёл все дни — следующая неделя сама. После последней круг начнётся сначала, и где положена прибавка — килограммы на штанге вырастут."
          : formulas.cycle_auto_end
            ? "Прошёл все дни — этап сменится сам. Где положена прибавка, поднимется «на раз» или килограммы на штанге. Последний этап закрывается руками: там новый цикл."
            : "Прошёл все дни — подскажем, а закроешь этап сам, когда восстановился."}
      </p>
    </section>
  );
}
