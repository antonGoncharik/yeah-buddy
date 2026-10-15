"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { cachedGet, postJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { MuscleId } from "@/lib/types";
import { activeSoreMarks, soreMuscles } from "@/lib/workout/sore";
import { readStoredSoreMarks } from "@/lib/workout/sore-marks";

interface SwapOption {
  exerciseId: string;
  name: string;
  line: string | null;
}

export function SessionSwapSheet({
  sessionId,
  sessionExerciseId,
  fromExerciseId,
  templateId,
  disabled,
  onSwap,
}: {
  sessionId: string;
  sessionExerciseId: string;
  fromExerciseId: string;
  templateId: string | null;
  disabled: boolean;
  onSwap: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [muscleId, setMuscleId] = useState<MuscleId | null>(null);
  const [options, setOptions] = useState<SwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [kept, setKept] = useState<{
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  } | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void cachedGet(
      `/api/sessions/${sessionId}/exercises/${sessionExerciseId}/swap`,
      (data) => {
        if (!cancelled) {
          const parsed = readSwaps(data);
          setMuscle(parsed.muscle);
          setMuscleId(parsed.muscleId);
          setOptions(parsed.options);
        }
        return true;
      },
    )
      .catch(() => {
        if (!cancelled) {
          setError(LOAD_FAILED);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionExerciseId, sessionId]);

  async function pick(exerciseId: string, name: string) {
    if (pendingId) {
      return;
    }
    const from = fromExerciseId;
    setPendingId(exerciseId);
    const ok = await onSwap(sessionExerciseId, exerciseId);
    setPendingId(null);
    if (!ok) {
      return;
    }
    if (templateId) {
      setKept({ fromExerciseId: from, exerciseId, name });
      return;
    }
    setOpen(false);
  }

  async function keepInTemplate() {
    if (!kept || savingTemplate) {
      return;
    }
    setSavingTemplate(true);
    setError(null);
    try {
      await postJson(`/api/sessions/${sessionId}/template-swap`, {
        fromExerciseId: kept.fromExerciseId,
        exerciseId: kept.exerciseId,
      });
      haptic("commit");
      setOpen(false);
      setKept(null);
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSavingTemplate(false);
    }
  }

  const sore = soreMuscles(
    activeSoreMarks(readStoredSoreMarks(), calendarToday()),
  );
  const muscleSore = muscleId != null && sore.includes(muscleId);

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
          setKept(null);
          setOpen(true);
        }}
      >
        <ArrowLeftRight className="size-4" aria-hidden />
      </Button>
      {open ? (
        <SheetFrame
          title={muscle ? `Чем заменить · ${muscle}` : "Чем заменить"}
          onCancel={() => setOpen(false)}
        >
          {kept ? (
            <div className="flex flex-col gap-2">
              <p className="text-base leading-snug">
                Сегодня стоит {kept.name}.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={savingTemplate}
                onClick={() => {
                  setOpen(false);
                  setKept(null);
                }}
              >
                Только на сегодня
              </Button>
              <Button
                type="button"
                className="min-h-11"
                disabled={savingTemplate}
                onClick={() => void keepInTemplate()}
              >
                {savingTemplate ? "Сохраняю…" : "Заменить и в шаблоне"}
              </Button>
            </div>
          ) : null}
          {error ? <p className="text-base text-destructive">{error}</p> : null}
          {kept ? null : (
            <>
              {loading ? (
                <p className="text-base text-muted-foreground">
                  Смотрю ту же мышцу…
                </p>
              ) : null}
              {muscleSore ? (
                <p className="text-base leading-snug text-muted-foreground">
                  Эта мышца болит. Замена останется в той же зоне.
                </p>
              ) : null}
              {!loading && !error && options.length === 0 ? (
                <p className="text-base text-muted-foreground">
                  На эту мышцу больше нечего подставить.
                </p>
              ) : null}
            </>
          )}
          {kept ? null : (
            <div className="flex flex-col gap-2">
              {options.map((option) => (
                <Button
                  key={option.exerciseId}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-12 justify-start py-2 text-left text-base"
                  disabled={pendingId != null}
                  onClick={() => void pick(option.exerciseId, option.name)}
                >
                  <span className="flex min-w-0 flex-col items-start">
                    <span>{option.name}</span>
                    {option.line ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {option.line}
                      </span>
                    ) : null}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </SheetFrame>
      ) : null}
    </>
  );
}

function readSwaps(data: unknown): {
  muscle: string | null;
  muscleId: MuscleId | null;
  options: SwapOption[];
} {
  if (typeof data !== "object" || data == null) {
    return { muscle: null, muscleId: null, options: [] };
  }
  const muscle =
    "muscle" in data && typeof data.muscle === "string" ? data.muscle : null;
  const muscleId =
    "muscleId" in data && typeof data.muscleId === "string"
      ? (data.muscleId as MuscleId)
      : null;
  const raw =
    "options" in data && Array.isArray(data.options) ? data.options : [];
  const options = raw.flatMap((item) => {
    if (typeof item !== "object" || item == null) {
      return [];
    }
    if (!("exerciseId" in item) || typeof item.exerciseId !== "string") {
      return [];
    }
    if (!("name" in item) || typeof item.name !== "string") {
      return [];
    }
    const line =
      "line" in item && typeof item.line === "string" ? item.line : null;
    return [{ exerciseId: item.exerciseId, name: item.name, line }];
  });
  return { muscle, muscleId, options };
}
