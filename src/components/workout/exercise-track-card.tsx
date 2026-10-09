"use client";

import { useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteJson, putJson } from "@/lib/api-cache";
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

  const body = (
    <>
      {!embedded ? (
        <div>
          <p className="text-base font-medium">Рабочий кг</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Нужен, если в дне стоит «Кг». После недели, если в цикле стоит
            прибавка, иначе — после тренировки. Максимум на раз отдельно.
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium">Рабочий</p>
      )}

      {track && !editing ? (
        <>
          <p
            className={
              embedded
                ? "text-2xl font-semibold tracking-tight tabular-nums"
                : "text-lg font-semibold tracking-tight tabular-nums"
            }
          >
            {current != null ? `${formatWeight(current)} кг` : "—"}
          </p>
          <div
            className={
              embedded ? "flex flex-col gap-1.5" : "flex flex-wrap gap-2"
            }
          >
            <Button
              type="button"
              variant={embedded ? "ghost" : "secondary"}
              className={
                embedded
                  ? "h-9 justify-start px-0 text-sm font-medium"
                  : "h-11 text-base"
              }
              disabled={busy}
              onClick={() => startEditing(current)}
            >
              Поправить
            </Button>
            {!embedded ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void remove()}
              >
                Убрать
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {!track && !editing ? (
        <Button
          type="button"
          variant={embedded ? "ghost" : "secondary"}
          className={
            embedded
              ? "h-9 justify-start px-0 text-sm font-medium"
              : "h-11 text-base"
          }
          onClick={() => startEditing(null)}
        >
          {embedded ? "Задать" : "Задать кг"}
        </Button>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-2" data-field-group>
          <Input
            aria-label="Рабочий кг"
            value={weightText}
            placeholder="кг"
            inputMode="decimal"
            enterKeyHint="done"
            className={
              embedded
                ? "h-11 text-base tabular-nums"
                : "h-12 text-base tabular-nums"
            }
            disabled={busy}
            onChange={(event) => setWeightText(event.target.value)}
          />
          {error ? (
            <p
              className={
                embedded
                  ? "text-xs text-destructive"
                  : "text-base leading-snug text-destructive"
              }
            >
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              className={
                embedded ? "h-9 flex-1 text-sm" : "h-11 flex-1 text-base"
              }
              disabled={busy || parsed == null || parsed <= 0}
              onClick={() => void save()}
            >
              {busy ? "…" : "Ок"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={embedded ? "h-9 text-sm" : "h-11 text-base"}
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      {!editing && error && embedded ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
      {!editing && error && !embedded ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-muted/35 px-3 py-3">
        {body}
        {track && !editing ? (
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

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      {body}
    </section>
  );
}

function readTrack(data: unknown): ExerciseTrack | null {
  const next = parseExerciseWithMax(isRecord(data) ? data.exercise : null);
  return next?.track ?? null;
}
