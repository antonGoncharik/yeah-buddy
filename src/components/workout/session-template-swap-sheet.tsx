"use client";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { useSessionTemplateSwap } from "@/components/workout/use-session-template-swap";
import type { WorkoutSession } from "@/lib/types";

export function SessionTemplateSwapSheet({
  session,
  offer,
  onClose,
}: {
  session: WorkoutSession;
  offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  };
  onClose: () => void;
}) {
  const { saving, error, dismiss, saveToTemplate } = useSessionTemplateSwap({
    session,
    offer,
    onClose,
  });

  return (
    <SheetFrame title="Замена в программе" onCancel={dismiss}>
      <p className="text-base leading-snug">Сегодня стоит {offer.name}.</p>
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={saving}
        onClick={dismiss}
      >
        Только на сегодня
      </Button>
      <Button
        type="button"
        className="min-h-11"
        disabled={saving}
        onClick={() => void saveToTemplate()}
      >
        {saving ? "Сохраняю…" : "Заменить и в шаблоне"}
      </Button>
    </SheetFrame>
  );
}
