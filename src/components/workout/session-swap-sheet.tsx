"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SessionSwapSheetContent } from "@/components/workout/session-swap-sheet-content";
import { useSessionSwapSheet } from "@/components/workout/use-session-swap-sheet";
import { haptic } from "@/lib/telegram/haptic";

export function SessionSwapSheet({
  sessionId,
  sessionExerciseId,
  fromExerciseId,
  templateId,
  disabled,
  onSwap,
  onOfferTemplate,
}: {
  sessionId: string;
  sessionExerciseId: string;
  fromExerciseId: string;
  templateId: string | null;
  disabled: boolean;
  onSwap: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
  onOfferTemplate?: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const sheet = useSessionSwapSheet({
    open,
    sessionId,
    sessionExerciseId,
    fromExerciseId,
    templateId,
    onSwap,
    onOfferTemplate,
    onClose: () => setOpen(false),
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-touch"
        className="shrink-0"
        disabled={disabled}
        aria-label="Чем заменить"
        onClick={() => {
          haptic("tap");
          setOpen(true);
        }}
      >
        <ArrowLeftRight className="size-4" aria-hidden />
      </Button>
      {open ? (
        <SessionSwapSheetContent
          muscle={sheet.muscle}
          muscleId={sheet.muscleId}
          options={sheet.options}
          loading={sheet.loading}
          error={sheet.error}
          pendingId={sheet.pendingId}
          onCancel={() => setOpen(false)}
          onPick={(exerciseId, name) => void sheet.pick(exerciseId, name)}
        />
      ) : null}
    </>
  );
}
