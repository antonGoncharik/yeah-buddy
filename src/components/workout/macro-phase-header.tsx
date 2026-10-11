"use client";

import Link from "next/link";

import { FlavorNote } from "@/components/layout/flavor-note";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import { firstPhaseLine } from "@/lib/flavor";
import type { CurrentMacroState, PhaseType } from "@/lib/types";
import {
  cycleTimeline,
  phaseEndHint,
  phaseHoldHint,
  phaseLinkLabel,
} from "@/lib/workout/hints";
import { phaseLabel } from "@/lib/workout/labels";

export function MacroPhaseHeader({
  state,
  titleOverride = null,
  pendingTimelinePhase = null,
}: {
  state: CurrentMacroState & {
    macro: NonNullable<CurrentMacroState["macro"]>;
    phase: NonNullable<CurrentMacroState["phase"]>;
  };
  titleOverride?: string | null;
  pendingTimelinePhase?: { phase_type: PhaseType; name: string } | null;
}) {
  const pending = titleOverride != null;
  const holdHint =
    !pending && state.phase_circle ? phaseHoldHint(state.phase_circle) : null;
  const endHint =
    !pending && state.phase_circle ? phaseEndHint(state.phase_circle) : null;
  const phaseLine =
    !pending && state.phase_circle ? firstPhaseLine(state.phase_circle) : null;
  const timelineType =
    pendingTimelinePhase?.phase_type ?? state.phase.phase_type;
  const timelineName = pendingTimelinePhase?.name ?? state.phase.name;
  const steps = cycleTimeline(
    state.planned_cycle,
    timelineType,
    timelineName,
  );

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <p className="text-sm text-muted-foreground">
        Круг{" "}
        {phaseLinkLabel(
          state.macro.number,
          state.phase_circle,
          state.phase.phase_type,
          state.phase.name,
        )}
      </p>
      <h2 className="text-2xl font-semibold">
        {titleOverride ?? phaseLabel(state.phase.phase_type, state.phase.name)}
      </h2>
      {steps.length > 0 ? <CycleTimeline steps={steps} /> : null}
      <FlavorNote line={phaseLine} />
      {holdHint ? <p className="text-base leading-snug">{holdHint}</p> : null}
      {endHint ? <p className="text-base leading-snug">{endHint}</p> : null}
      <Link
        href="/settings/formulas/cycle"
        className="text-base font-medium text-primary"
      >
        Изменить недели
      </Link>
    </section>
  );
}
