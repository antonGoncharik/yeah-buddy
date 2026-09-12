"use client";

import Link from "next/link";

import { FlavorNote } from "@/components/layout/flavor-note";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import { firstDeloadLine } from "@/lib/flavor";
import type { CurrentMacroState } from "@/lib/types";
import {
  cycleTimeline,
  phaseEndHint,
  phaseHoldHint,
  phaseLinkLabel,
} from "@/lib/workout/hints";
import { FORMULAS_LABEL, phaseLabel } from "@/lib/workout/labels";

export function MacroPhaseHeader({
  state,
}: {
  state: CurrentMacroState & {
    macro: NonNullable<CurrentMacroState["macro"]>;
    phase: NonNullable<CurrentMacroState["phase"]>;
  };
}) {
  const holdHint = state.phase_circle
    ? phaseHoldHint(state.phase_circle)
    : null;
  const endHint = state.phase_circle ? phaseEndHint(state.phase_circle) : null;
  const deloadLine = firstDeloadLine(state.phase_circle);
  const steps = cycleTimeline(
    state.planned_cycle,
    state.phase.phase_type,
    state.phase.name,
  );

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
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
      <p className="text-sm leading-relaxed text-muted-foreground">
        Тренировки те же, что в очереди. Этап меняет веса. Закрываешь кнопкой
        ниже.
      </p>
      {steps.length > 0 ? <CycleTimeline steps={steps} /> : null}
      <FlavorNote line={deloadLine} />
      {holdHint ? <p className="text-base leading-snug">{holdHint}</p> : null}
      {endHint ? <p className="text-base leading-snug">{endHint}</p> : null}
      <Link
        href="/settings/formulas"
        className="text-base font-medium text-primary"
      >
        {FORMULAS_LABEL}
      </Link>
    </section>
  );
}
