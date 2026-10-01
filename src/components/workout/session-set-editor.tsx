"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import {
  parseRir,
  type SetDraft,
  stepDraftValue,
} from "@/components/workout/session-drafts";
import { SessionHoldTimer } from "@/components/workout/session-hold-timer";
import { handleNumericEnter } from "@/lib/form/field-nav";
import {
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
} from "@/lib/form/numeric-draft";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseDecimal } from "@/lib/workout/numbers";
import { setUsesSeconds } from "@/lib/workout/session-format";

const HOLD_STEP_SECONDS = 5;
const RESERVE_CHOICES = [0, 1, 2, 3] as const;

export function SessionSetEditor({
  set,
  draft,
  disabled,
  groupCount,
  weightStep,
  onDraft,
}: {
  set: WorkoutSet;
  draft: SetDraft;
  disabled: boolean;
  groupCount: number;
  weightStep: number;
  onDraft: (patch: Partial<SetDraft>) => void;
}) {
  const withRir = set.set_type === "work";
  const timed = setUsesSeconds(set);
  const groupTitle =
    groupCount > 1 ? `${groupCount} ${setCountWord(groupCount)}` : null;
  const typedReserve = parseRir(draft.rir);
  const shownReserve = typedReserve ?? set.planned_rir;

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
        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label="кг"
            value={draft.weight}
            disabled={disabled}
            inputMode="decimal"
            enterKeyHint="next"
            onChange={(value) => onDraft({ weight: value })}
            onStep={(direction) => step("weight", direction)}
          />
          {timed ? (
            <Stepper
              label="сек"
              value={draft.seconds}
              disabled={disabled}
              inputMode="decimal"
              enterKeyHint={withRir ? "next" : "done"}
              onChange={(value) => onDraft({ seconds: value })}
              onStep={(direction) => step("seconds", direction)}
            />
          ) : (
            <Stepper
              label="раз"
              value={draft.reps}
              disabled={disabled}
              inputMode="numeric"
              enterKeyHint={withRir ? "next" : "done"}
              onChange={(value) => onDraft({ reps: value })}
              onStep={(direction) => step("reps", direction)}
            />
          )}
        </div>
        {timed ? (
          <SessionHoldTimer
            seconds={parseDecimal(draft.seconds)}
            disabled={disabled}
          />
        ) : null}
        {withRir ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">запас</span>
            <div className="grid grid-cols-4 gap-1.5">
              {RESERVE_CHOICES.map((choice) => {
                const selected = shownReserve === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    className={cn(
                      "h-11 rounded-lg text-base font-medium disabled:opacity-50",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground",
                    )}
                    onClick={() => {
                      if (typedReserve == null && set.planned_rir === choice) {
                        return;
                      }
                      haptic("tick");
                      onDraft({
                        rir: typedReserve === choice ? "" : String(choice),
                      });
                    }}
                  >
                    {choice === 0 ? "отказ" : choice}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function setCountWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "подход";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "подхода";
  }
  return "подходов";
}

function Stepper({
  label,
  value,
  disabled,
  inputMode,
  enterKeyHint,
  onChange,
  onStep,
}: {
  label: string;
  value: string;
  disabled: boolean;
  inputMode: "decimal" | "numeric";
  enterKeyHint: "next" | "done";
  onChange: (value: string) => void;
  onStep: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <StepButton
          label={`Меньше, ${label}`}
          disabled={disabled}
          onClick={() => onStep(-1)}
        >
          <Minus className="size-4" />
        </StepButton>
        <Input
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              inputMode === "numeric"
                ? sanitizeIntegerDraft(event.target.value)
                : sanitizeDecimalDraft(event.target.value),
            )
          }
          onKeyDown={handleNumericEnter}
          className="h-11 min-w-0 flex-1 px-1 text-center text-lg font-semibold tabular-nums"
          aria-label={label}
        />
        <StepButton
          label={`Больше, ${label}`}
          disabled={disabled}
          onClick={() => onStep(1)}
        >
          <Plus className="size-4" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-background disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
