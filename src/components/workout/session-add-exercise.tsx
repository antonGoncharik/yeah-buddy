"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SessionAddExerciseSheet } from "@/components/workout/session-add-exercise-sheet";
import {
  useSessionAddExerciseRows,
  useSessionAddExerciseSheet,
} from "@/components/workout/use-session-add-exercise-sheet";

export function SessionAddExercise({
  takenIds,
  disabled,
  onAdd,
}: {
  takenIds: string[];
  disabled: boolean;
  onAdd: (exerciseId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const sheet = useSessionAddExerciseSheet(open);
  const rows = useSessionAddExerciseRows(
    sheet.exercises,
    takenIds,
    sheet.query,
  );

  async function pick(id: string) {
    if (sheet.addingId) {
      return;
    }
    sheet.setAddingId(id);
    const ok = await onAdd(id);
    sheet.setAddingId(null);
    if (ok) {
      setOpen(false);
      sheet.setQuery("");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 text-base"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" aria-hidden />
        Добавить упражнение
      </Button>
      {open ? (
        <SessionAddExerciseSheet
          query={sheet.query}
          onQueryChange={sheet.setQuery}
          loading={sheet.loading}
          error={sheet.error}
          exercises={sheet.exercises}
          rows={rows}
          addingId={sheet.addingId}
          onCancel={() => {
            if (sheet.addingId == null) {
              setOpen(false);
            }
          }}
          onPick={(id) => void pick(id)}
        />
      ) : null}
    </>
  );
}
