"use client";

import { GuideTipCard } from "@/components/guide/guide-tip-card";
import {
  PROGRAM_EDITABLE_HINT_BODY,
  PROGRAM_EDITABLE_HINT_TITLE,
} from "@/lib/workout/program-editable-hint";

export function ProgramEditableHintCard({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <GuideTipCard
      tip={{
        id: "workouts",
        title: PROGRAM_EDITABLE_HINT_TITLE,
        body: PROGRAM_EDITABLE_HINT_BODY,
      }}
      onDismiss={onDismiss}
    />
  );
}
