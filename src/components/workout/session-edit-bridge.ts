import type { Dispatch, SetStateAction } from "react";

import type { SessionDetail } from "@/lib/types";
import { sessionFailAction } from "@/lib/workout/session-action-errors";

export type SessionEditBridge = {
  detail: SessionDetail | null;
  note: string;
  applyPayload: (data: unknown) => SessionDetail | null;
  runBusy: (work: () => Promise<void>) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDetail: Dispatch<SetStateAction<SessionDetail | null>>;
};

export function reportSessionEditError(
  setError: SessionEditBridge["setError"],
  caught: unknown,
): void {
  sessionFailAction((message) => setError(message), caught);
}

export function lastWorkSetId(
  detail: SessionDetail,
  sessionExerciseId: string,
): string | null {
  const added = detail.exercises
    .find((item) => item.id === sessionExerciseId)
    ?.sets.filter((set) => set.set_type === "work")
    .reduce<(typeof detail.exercises)[number]["sets"][number] | null>(
      (best, set) =>
        best == null || set.set_number > best.set_number ? set : best,
      null,
    );
  return added?.id ?? null;
}
