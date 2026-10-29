"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import { putJson } from "@/lib/api-cache";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export function SlotPlanTrackWorkingField({
  exercise,
}: {
  exercise: ExerciseWithMax;
}) {
  const current = exercise.track ? trackCurrentWeight(exercise.track) : null;
  const [text, setText] = useState(
    current != null && current > 0 ? formatWeight(current) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setText(current != null && current > 0 ? formatWeight(current) : "");
  }, [current]);

  async function commit() {
    const parsed = parseDecimal(text);
    if (parsed == null || parsed <= 0) {
      if (text.trim() === "" && current != null) {
        setText(formatWeight(current));
      }
      return;
    }
    if (current != null && parsed === current) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await putJson(`/api/exercises/${exercise.id}/track`, { weight: parsed });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setText(current != null && current > 0 ? formatWeight(current) : "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">На штанге, кг</span>
      <Input
        aria-label="На штанге, кг"
        inputMode="decimal"
        enterKeyHint="done"
        disabled={busy}
        value={text}
        className={EXERCISE_LOAD_INPUT_CLASS}
        onChange={(event) => setText(sanitizeDecimalDraft(event.target.value))}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-sm leading-snug text-muted-foreground">
        От этого веса считаются подходы с типом «Кг».
      </p>
    </div>
  );
}
