"use client";

import type { CurrentMacroState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { phaseEndHint, phaseLinkLabel } from "@/lib/workout/hints";
import { phaseLabel } from "@/lib/workout/labels";

export function MacroPhaseHeader({
  state,
}: {
  state: CurrentMacroState & {
    macro: NonNullable<CurrentMacroState["macro"]>;
    phase: NonNullable<CurrentMacroState["phase"]>;
  };
}) {
  return (
    <section className="card-surface flex flex-col gap-2 px-5 py-5">
      <p className="text-sm text-muted-foreground">
        Цикл{" "}
        {phaseLinkLabel(
          state.macro.number,
          state.phase_circle,
          state.phase.phase_type,
          state.phase.name,
        )}
      </p>
      <h2 className="text-2xl font-semibold">
        {phaseLabel(state.phase.phase_type, state.phase.name)}
      </h2>
      <p className="text-sm text-muted-foreground">
        С {state.phase.start_date}. Этап закрываешь кнопкой ниже.
      </p>
      {state.phase_circle && phaseEndHint(state.phase_circle) ? (
        <p className="text-base leading-snug">
          {phaseEndHint(state.phase_circle)}
        </p>
      ) : null}
      <ol className="mt-2 flex flex-wrap gap-2">
        {state.phases.map((phase) => (
          <li
            key={phase.id}
            className={cn(
              "rounded-full px-3 py-1 text-sm",
              phase.status === "current"
                ? "bg-primary/12 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {phaseLabel(phase.phase_type, phase.name)}
          </li>
        ))}
      </ol>
    </section>
  );
}
