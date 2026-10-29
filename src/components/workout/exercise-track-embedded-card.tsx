"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import { useExerciseTrackMutations } from "@/components/workout/use-exercise-track-mutations";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import type { ExerciseWithMax } from "@/lib/types";
import { formatExerciseTrackDraft } from "@/lib/workout/exercise-track-payload";
import { BAR_KG_FIELD } from "@/lib/workout/user-copy";

export function ExerciseTrackEmbeddedCard({
  exercise,
}: {
  exercise: ExerciseWithMax;
}) {
  const mutations = useExerciseTrackMutations({
    exerciseId: exercise.id,
    initialTrack: exercise.track,
  });
  const [weightText, setWeightText] = useState(() =>
    formatExerciseTrackDraft(exercise.track),
  );

  useEffect(() => {
    setWeightText(formatExerciseTrackDraft(mutations.track));
  }, [mutations.track]);

  async function commit() {
    const parsed = mutations.parseWeight(weightText);
    if (parsed == null || parsed <= 0) {
      if (weightText.trim() === "" && mutations.track) {
        setWeightText(formatExerciseTrackDraft(mutations.track));
      }
      return;
    }
    await mutations.saveWeight(parsed, () =>
      setWeightText(formatExerciseTrackDraft(mutations.track)),
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
      <p className="text-sm font-medium">{BAR_KG_FIELD}</p>
      <Input
        aria-label={BAR_KG_FIELD}
        value={weightText}
        inputMode="decimal"
        enterKeyHint="done"
        className={EXERCISE_LOAD_INPUT_CLASS}
        disabled={mutations.busy}
        onChange={(event) =>
          setWeightText(sanitizeDecimalDraft(event.target.value))
        }
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
            event.currentTarget.blur();
          }
        }}
      />
      {mutations.error ? (
        <p className="text-xs text-destructive">{mutations.error}</p>
      ) : null}
      {mutations.track ? (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
          disabled={mutations.busy}
          onClick={() => void mutations.removeTrack()}
        >
          Убрать
        </button>
      ) : null}
    </div>
  );
}
