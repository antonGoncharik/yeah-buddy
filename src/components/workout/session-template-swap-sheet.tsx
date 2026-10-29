"use client";

import { useState } from "react";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSession } from "@/lib/types";
import { rememberTemplateSwap } from "@/lib/workout/template-cache-swap";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function dismiss() {
    if (!saving) {
      onClose();
      setError(null);
    }
  }

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
        onClick={() => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              await postJson(`/api/sessions/${session.id}/template-swap`, {
                fromExerciseId: offer.fromExerciseId,
                exerciseId: offer.exerciseId,
              });
              if (session.template_id) {
                rememberTemplateSwap({
                  templateId: session.template_id,
                  date: session.session_date,
                  fromExerciseId: offer.fromExerciseId,
                  exerciseId: offer.exerciseId,
                });
              }
              haptic("commit");
              onClose();
            } catch (caught) {
              haptic("error");
              setError(caught instanceof Error ? caught.message : LOAD_FAILED);
            } finally {
              setSaving(false);
            }
          })();
        }}
      >
        {saving ? "Сохраняю…" : "Заменить и в шаблоне"}
      </Button>
    </SheetFrame>
  );
}
