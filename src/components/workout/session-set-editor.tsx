"use client";

import { Mic } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  draftFromPlan,
  draftMatchesPlan,
  type SetDraft,
  stepDraftValue,
} from "@/components/workout/session-drafts";
import { SessionHoldTimer } from "@/components/workout/session-hold-timer";
import { SessionSetReservePicker } from "@/components/workout/session-set-reserve-picker";
import { SessionSetStepper } from "@/components/workout/session-set-stepper";
import { SessionSetVoice } from "@/components/workout/session-set-voice";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSet } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { plateDeltaLine, platesLine } from "@/lib/workout/plates";
import { formatSetLine, setUsesSeconds } from "@/lib/workout/session-format";
import { setCountWord } from "@/lib/workout/set-count-word";

export { setCountWord } from "@/lib/workout/set-count-word";

const HOLD_STEP_SECONDS = 5;

export function SessionSetEditor({
  set,
  draft,
  disabled,
  groupCount,
  weightStep,
  onDraft,
  onLog,
  previousKg = null,
}: {
  set: WorkoutSet;
  draft: SetDraft;
  disabled: boolean;
  groupCount: number;
  weightStep: number;
  onDraft: (patch: Partial<SetDraft>) => void;
  onLog?: (draft: SetDraft) => void;
  previousKg?: number | null;
}) {
  const withRir = set.set_type === "work";
  const timed = setUsesSeconds(set);
  const groupTitle =
    groupCount > 1 ? `${groupCount} ${setCountWord(groupCount)}` : null;
  const planLine = formatSetLine(set);
  const offPlan = !draftMatchesPlan(set, draft);
  const loadKg = parseDecimal(draft.weight) ?? 0;
  const loadLine = platesLine(loadKg);
  const deltaLine = plateDeltaLine(previousKg, loadKg);
  const [voiceOpen, setVoiceOpen] = useState(false);

  function step(kind: "weight" | "reps" | "seconds", direction: -1 | 1) {
    haptic("tick");
    if (kind === "weight") {
      onDraft({
        weight: stepDraftValue(draft.weight, direction, weightStep, "weight"),
      });
      return;
    }
    if (kind === "seconds") {
      onDraft({
        seconds: stepDraftValue(
          draft.seconds,
          direction,
          HOLD_STEP_SECONDS,
          "seconds",
        ),
      });
      return;
    }
    onDraft({
      reps: stepDraftValue(draft.reps, direction, 1, "reps"),
    });
  }

  return (
    <div className="w-full pt-1 pb-1" data-field-group>
      <div className="flex flex-col gap-3 rounded-xl bg-muted/60 px-3 py-3">
        {groupTitle ? (
          <p className="text-sm text-muted-foreground">{groupTitle}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            План: <span className="tabular-nums">{planLine}</span>
          </p>
          {!disabled ? (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground"
              aria-label={voiceOpen ? "Скрыть ввод строкой" : "Сказать подход"}
              aria-expanded={voiceOpen}
              onClick={() => {
                haptic("tap");
                setVoiceOpen((open) => !open);
              }}
            >
              <Mic className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        {voiceOpen ? (
          <SessionSetVoice
            disabled={disabled}
            timed={timed}
            needsWeight={set.planned_weight != null && set.planned_weight > 0}
            draft={draft}
            onApply={onDraft}
            onCommit={
              onLog ? (patch) => onLog({ ...draft, ...patch }) : undefined
            }
          />
        ) : null}
        <div className="flex flex-col gap-3">
          <SessionSetStepper
            label="Вес, кг"
            value={draft.weight}
            disabled={disabled}
            inputMode="decimal"
            enterKeyHint="next"
            onChange={(value) => onDraft({ weight: value })}
            onStep={(direction) => step("weight", direction)}
          />
          {timed ? (
            <SessionSetStepper
              label="Секунды"
              value={draft.seconds}
              disabled={disabled}
              inputMode="decimal"
              enterKeyHint={withRir ? "next" : "done"}
              onChange={(value) => onDraft({ seconds: value })}
              onStep={(direction) => step("seconds", direction)}
            />
          ) : (
            <SessionSetStepper
              label="Повторы"
              value={draft.reps}
              disabled={disabled}
              inputMode="numeric"
              enterKeyHint={withRir ? "next" : "done"}
              onChange={(value) => onDraft({ reps: value })}
              onStep={(direction) => step("reps", direction)}
            />
          )}
        </div>
        {loadLine ? (
          <p className="text-xs text-muted-foreground">
            {loadLine}
            {deltaLine ? ` ${deltaLine}` : ""}
          </p>
        ) : null}
        {timed ? (
          <SessionHoldTimer
            seconds={parseDecimal(draft.seconds)}
            disabled={disabled}
          />
        ) : null}
        {withRir ? (
          <SessionSetReservePicker
            set={set}
            draft={draft}
            disabled={disabled}
            onDraft={onDraft}
          />
        ) : null}
        {!disabled && offPlan ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full text-base"
            onClick={() => {
              haptic("tap");
              onDraft(draftFromPlan(set));
            }}
          >
            По плану
          </Button>
        ) : null}
      </div>
    </div>
  );
}
