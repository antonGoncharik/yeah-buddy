"use client";

import { ExerciseTrackEmbeddedCard } from "@/components/workout/exercise-track-embedded-card";
import { ExerciseTrackStandaloneCard } from "@/components/workout/exercise-track-standalone-card";
import type { ExerciseWithMax } from "@/lib/types";

/** Working kilograms for slots that use kg, same role as 1RM for percent. */
export function ExerciseTrackCard({
  exercise,
  embedded = false,
}: {
  exercise: ExerciseWithMax;
  embedded?: boolean;
}) {
  if (embedded) {
    return <ExerciseTrackEmbeddedCard exercise={exercise} />;
  }
  return <ExerciseTrackStandaloneCard exercise={exercise} />;
}
