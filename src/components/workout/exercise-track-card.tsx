"use client";

import { useEffect, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import { deleteJson, putJson } from "@/lib/api-cache";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { LOAD_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import type { ExerciseTrack, ExerciseWithMax } from "@/lib/types";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { trackCurrentWeight } from "@/lib/workout/track-line";

/**
 * Working kilograms for slots that use kg, same role as 1RM for percent.
 */
export function ExerciseTrackCard({
  exercise,
  embedded = false,
}: {
  exercise: ExerciseWithMax;
  embedded?: boolean;
}) {
  if (embedded) {
    return <EmbeddedWorkingWeight exercise={exercise} />;
  }

  return <StandaloneWorkingWeight exercise={exercise} />;
}

function EmbeddedWorkingWeight({ exercise }: { exercise: ExerciseWithMax }) {
  const confirm = useConfirm();
  const [track, setTrack] = useState<ExerciseTrack | null>(exercise.track);
  const [weightText, setWeightText] = useState(() => formatTrackDraft(track));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeightText(formatTrackDraft(track));
  }, [track]);

  async function commit() {
    const parsed = parseDecimal(weightText);
    const current = track ? trackCurrentWeight(track) : null;

    if (parsed == null || parsed <= 0) {
      if (weightText.trim() === "" && track) {
        setWeightText(formatTrackDraft(track));
      }
      return;
    }

    if (current != null && parsed === current) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await putJson(`/api/exercises/${exercise.id}/track`, {
        weight: parsed,
      });
      setTrack(readTrack(data));
      haptic("commit");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setWeightText(formatTrackDraft(track));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      message:
        "Убрать рабочий кг? Подходы с типом «Кг» снова спросят вес в зале.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteJson(`/api/exercises/${exercise.id}/track`);
      setTrack(null);
      haptic("commit");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
      <p className="text-sm font-medium">Рабочий, кг</p>
      <Input
        aria-label="Рабочий кг"
        value={weightText}
        inputMode="decimal"
        enterKeyHint="done"
        className={EXERCISE_LOAD_INPUT_CLASS}
        disabled={busy}
        onChange={(event) =>
          setWeightText(sanitizeDecimalDraft(event.target.value))
        }
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {track ? (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
          disabled={busy}
          onClick={() => void remove()}
        >
          Убрать рабочий
        </button>
      ) : null}
    </div>
  );
}

function StandaloneWorkingWeight({ exercise }: { exercise: ExerciseWithMax }) {
  const confirm = useConfirm();
  const [track, setTrack] = useState<ExerciseTrack | null>(exercise.track);
  const [editing, setEditing] = useState(false);
  const [weightText, setWeightText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = track ? trackCurrentWeight(track) : null;
  const parsed = parseDecimal(weightText);

  function startEditing(kg: number | null) {
    setWeightText(kg != null && kg > 0 ? formatWeight(kg) : "");
    setEditing(true);
    setError(null);
  }

  async function save() {
    if (parsed == null || parsed <= 0) {
      setError("Нужен рабочий вес.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await putJson(`/api/exercises/${exercise.id}/track`, {
        weight: parsed,
      });
      const next = readTrack(data);
      setTrack(next);
      setEditing(false);
      haptic("commit");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({
      message:
        "Убрать рабочий кг? Подходы с типом «Кг» снова спросят вес в зале.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteJson(`/api/exercises/${exercise.id}/track`);
      setTrack(null);
      setEditing(false);
      haptic("commit");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-base font-medium">Рабочий кг</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Нужен, если в дне стоит «Кг». После недели, если в цикле стоит
          прибавка, иначе — после тренировки. Максимум на раз отдельно.
        </p>
      </div>

      {track && !editing ? (
        <>
          <p className="text-lg font-semibold tracking-tight tabular-nums">
            {current != null ? `${formatWeight(current)} кг` : "нет"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 text-base"
              disabled={busy}
              onClick={() => startEditing(current)}
            >
              Поправить
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={busy}
              onClick={() => void remove()}
            >
              Убрать
            </Button>
          </div>
        </>
      ) : null}

      {!track && !editing ? (
        <Button
          type="button"
          variant="secondary"
          className="h-11 text-base"
          onClick={() => startEditing(null)}
        >
          Задать кг
        </Button>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-3" data-field-group>
          <Input
            aria-label="Рабочий кг"
            value={weightText}
            inputMode="decimal"
            enterKeyHint="done"
            className="h-12 text-base tabular-nums"
            disabled={busy}
            onChange={(event) => setWeightText(event.target.value)}
          />
          {error ? (
            <p className="text-base leading-snug text-destructive">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-11 flex-1 text-base"
              disabled={busy || parsed == null || parsed <= 0}
              onClick={() => void save()}
            >
              {busy ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      {!editing && error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </section>
  );
}

function formatTrackDraft(track: ExerciseTrack | null): string {
  const current = track ? trackCurrentWeight(track) : null;
  return current != null && current > 0 ? formatWeight(current) : "";
}

function readTrack(data: unknown): ExerciseTrack | null {
  const next = parseExerciseWithMax(isRecord(data) ? data.exercise : null);
  return next?.track ?? null;
}
