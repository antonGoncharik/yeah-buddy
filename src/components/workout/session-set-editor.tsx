"use client";

import { Input } from "@/components/ui/input";
import type { SetDraft } from "@/components/workout/session-drafts";
import { SessionHoldTimer } from "@/components/workout/session-hold-timer";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type { WorkoutSet } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { setRirLabel, setUsesSeconds } from "@/lib/workout/session-format";

export function SessionSetEditor({
  set,
  draft,
  disabled,
  groupCount,
  setNumber,
  onDraft,
}: {
  set: WorkoutSet;
  draft: SetDraft;
  disabled: boolean;
  groupCount: number;
  setNumber: number;
  onDraft: (patch: Partial<SetDraft>) => void;
}) {
  const kind = set.set_type === "warmup" ? "Разминка" : "Рабочий";
  const title =
    groupCount > 1
      ? `${kind} · ${groupCount} ${setCountWord(groupCount)}`
      : `${kind} ${setNumber}`;
  const plannedRir = setRirLabel(set, false);
  const withRir = set.set_type === "work";
  const columns = withRir ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="w-full pt-1 pb-1" data-field-group>
      <div className={`grid ${columns} gap-2 rounded-xl bg-muted/60 px-3 py-3`}>
        <p className="col-span-full text-sm text-muted-foreground">
          {title}
          {plannedRir ? ` · план: ${plannedRir}` : ""}
        </p>
        <FieldInput
          label="кг"
          value={draft.weight}
          disabled={disabled}
          inputMode="decimal"
          enterKeyHint="next"
          onChange={(value) => onDraft({ weight: value })}
        />
        {setUsesSeconds(set) ? (
          <>
            <FieldInput
              label="сек"
              value={draft.seconds}
              disabled={disabled}
              inputMode="decimal"
              enterKeyHint="done"
              onChange={(value) => onDraft({ seconds: value })}
            />
            <SessionHoldTimer
              seconds={parseDecimal(draft.seconds)}
              disabled={disabled}
            />
          </>
        ) : (
          <FieldInput
            label="раз"
            value={draft.reps}
            disabled={disabled}
            inputMode="numeric"
            enterKeyHint={withRir ? "next" : "done"}
            onChange={(value) => onDraft({ reps: value })}
          />
        )}
        {withRir ? (
          <FieldInput
            label="запас"
            value={draft.rir}
            disabled={disabled}
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="RIR"
            onChange={(value) => onDraft({ rir: value })}
          />
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

function FieldInput({
  label,
  value,
  disabled,
  inputMode,
  enterKeyHint,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  inputMode: "decimal" | "numeric";
  enterKeyHint: "next" | "done";
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleNumericEnter}
        className="h-11 text-base"
        aria-label={label}
      />
    </div>
  );
}
