"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

interface SwapOption {
  exerciseId: string;
  name: string;
  line: string | null;
}

export function SessionSwapSheet({
  sessionId,
  sessionExerciseId,
  disabled,
  onSwap,
}: {
  sessionId: string;
  sessionExerciseId: string;
  disabled: boolean;
  onSwap: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [options, setOptions] = useState<SwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  async function pick(exerciseId: string) {
    if (pendingId) {
      return;
    }
    setPendingId(exerciseId);
    const ok = await onSwap(sessionExerciseId, exerciseId);
    setPendingId(null);
    if (ok) {
      setOpen(false);
    }
  }

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
        <SheetFrame
          title={muscle ? `Чем заменить · ${muscle}` : "Чем заменить"}
          onCancel={() => setOpen(false)}
        >
          {loading ? (
            <p className="text-base text-muted-foreground">
              Смотрю ту же мышцу…
            </p>
          ) : null}
          {error ? <p className="text-base text-destructive">{error}</p> : null}
          {!loading && !error && options.length === 0 ? (
            <p className="text-base text-muted-foreground">
              На эту мышцу больше нечего подставить.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <Button
                key={option.exerciseId}
                type="button"
                variant="outline"
                className="h-auto min-h-12 justify-start py-2 text-left text-base"
                disabled={pendingId != null}
                onClick={() => void pick(option.exerciseId)}
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
        </SheetFrame>
      ) : null}
    </>
  );
}

function readSwaps(data: unknown): {
  muscle: string | null;
  options: SwapOption[];
} {
  if (typeof data !== "object" || data == null) {
    return { muscle: null, options: [] };
  }
  const muscle =
    "muscle" in data && typeof data.muscle === "string" ? data.muscle : null;
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
  return { muscle, options };
}
