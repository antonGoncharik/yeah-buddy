"use client";

import { useMemo, useState } from "react";

import type { Exercise } from "@/lib/types";
import { buildMissingTrackEntries } from "@/lib/workout/session-missing-tracks-fill";

export function useSessionMissingTracksForm(exercises: Exercise[]) {
  const [values, setValues] = useState<Record<string, string>>({});

  const filled = useMemo(
    () => buildMissingTrackEntries(exercises, values),
    [exercises, values],
  );

  return { values, setValues, filled };
}
