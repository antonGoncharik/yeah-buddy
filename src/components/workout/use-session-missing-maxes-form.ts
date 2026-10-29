"use client";

import { useMemo, useState } from "react";

import type { Exercise } from "@/lib/types";
import { buildMissingMaxEntries } from "@/lib/workout/session-missing-maxes";

export function useSessionMissingMaxesForm(exercises: Exercise[]) {
  const [oneRm, setOneRm] = useState<Record<string, string>>({});
  const [workKg, setWorkKg] = useState<Record<string, string>>({});
  const [workReps, setWorkReps] = useState<Record<string, string>>({});

  const filled = useMemo(
    () => buildMissingMaxEntries(exercises, oneRm, workKg, workReps),
    [exercises, oneRm, workKg, workReps],
  );

  return {
    oneRm,
    setOneRm,
    workKg,
    setWorkKg,
    workReps,
    setWorkReps,
    filled,
  };
}
