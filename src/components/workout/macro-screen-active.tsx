"use client";

import { useState } from "react";

import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacroPhaseHeader } from "@/components/workout/macro-phase-header";
import { MacroPhaseMaxes } from "@/components/workout/macro-phase-maxes";
import { MacroRecapCard } from "@/components/workout/macro-recap-card";
import type { CurrentMacroState, PhaseType } from "@/lib/types";
import { phaseLabel } from "@/lib/workout/labels";
import {
  type MacroAdvanceStep,
  macroAdvanceButtonLabel,
} from "@/lib/workout/macro-advance-copy";

export function MacroScreenActiveMacro({
  state,
  justClosed,
  drafts,
  forward,
  pendingTitle,
  pendingTimelinePhase,
  transitionDate,
  setTransitionDate,
  error,
  advancing,
  advanceStep,
  onDraftChange,
  onForwardChange,
  onCompleteWeek,
}: {
  state: CurrentMacroState & {
    macro: NonNullable<CurrentMacroState["macro"]>;
    phase: NonNullable<CurrentMacroState["phase"]>;
  };
  justClosed: boolean;
  drafts: Record<string, string>;
  forward: Record<string, string | null>;
  pendingTitle: string | null;
  pendingTimelinePhase: { phase_type: PhaseType; name: string } | null;
  transitionDate: string;
  setTransitionDate: (value: string) => void;
  error: string | null;
  advancing: boolean;
  advanceStep: MacroAdvanceStep | null;
  onDraftChange: (id: string, value: string) => void;
  onForwardChange: (id: string, value: string) => void;
  onCompleteWeek: () => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <>
      {state.last_recap ? (
        <MacroRecapCard
          key={state.last_recap.macro_id}
          recap={state.last_recap}
          featured={justClosed}
        />
      ) : null}
      <MacroPhaseHeader
        state={{
          ...state,
          macro: state.macro,
          phase: state.phase,
        }}
        titleOverride={pendingTitle}
        pendingTimelinePhase={pendingTimelinePhase}
      />

      <MacroPhaseMaxes
        maxes={state.maxes}
        drafts={drafts}
        forward={pendingTitle ? {} : forward}
        onDraftChange={onDraftChange}
        onForwardChange={onForwardChange}
      />

      {dateOpen ? (
        <Input
          type="date"
          aria-label="Дата"
          value={transitionDate}
          onChange={(event) => setTransitionDate(event.target.value)}
          className="h-12 text-base"
        />
      ) : (
        <button
          type="button"
          className="self-start text-base text-muted-foreground"
          onClick={() => setDateOpen(true)}
        >
          Другая дата
        </button>
      )}

      {error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}

      <StickyActions>
        <Button
          type="button"
          className="h-14 text-lg"
          disabled={advancing}
          onClick={() => void onCompleteWeek()}
        >
          {macroAdvanceButtonLabel({
            advancing,
            step: advanceStep,
            lastInCycle: state.phase_circle?.last_in_cycle === true,
            phaseTitle: phaseLabel(state.phase.phase_type, state.phase.name),
          })}
        </Button>
      </StickyActions>
    </>
  );
}
