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
import { cn } from "@/lib/utils";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { MAX_TRACK_STEPS } from "@/lib/workout/slot-plan-schema";
import {
  DEFAULT_TRACK_LENGTH,
  generateTrackSteps,
  nextTrackProposal,
  trackFinished,
  trackSummary,
} from "@/lib/workout/track-line";

/**
 * The exercise's weight line: an explicit row of kilograms, one step per
 * session. Edited as plain text («80, 82.5, 85») so any table pastes in.
 */
export function ExerciseTrackCard({ exercise }: { exercise: ExerciseWithMax }) {
  const confirm = useConfirm();
  const [track, setTrack] = useState<ExerciseTrack | null>(exercise.track);
  const [editing, setEditing] = useState(false);
  const [stepsText, setStepsText] = useState("");
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedSteps = parseStepsText(stepsText);
  const safePosition = Math.min(position, parsedSteps.length);

  function startEditing(steps: number[], startAt: number) {
    setStepsText(steps.map(formatWeight).join(", "));
    setPosition(Math.min(startAt, steps.length));
    setEditing(true);
    setError(null);
  }

  async function save() {
    if (parsedSteps.length === 0) {
      setError("Нужен хотя бы один вес.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await putJson(`/api/exercises/${exercise.id}/track`, {
        steps: parsedSteps,
        position: safePosition,
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
        "Убрать линейку? Слоты «по линейке» снова спросят стартовый вес.",
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
        <p className="text-base font-medium">Линейка весов</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Для слотов «по линейке»: ряд весов, каждую тренировку следующий шаг.
          После последнего шага вес держится, пока не задашь новую линейку.
        </p>
      </div>

      {track && !editing ? (
        <>
          <p className="text-lg font-semibold tracking-tight">
            {trackSummary(track)}
          </p>
          <ol className="flex flex-wrap gap-1.5">
            {track.steps.map((step, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: a line may repeat a weight (deload), position is the identity
                key={`${index}-${step}`}
                className={cn(
                  "rounded-full px-2.5 py-1 text-sm tabular-nums",
                  index < track.position
                    ? "bg-muted text-muted-foreground line-through"
                    : index === track.position
                      ? "bg-primary/12 font-medium text-primary"
                      : "bg-muted/60",
                )}
              >
                {formatWeight(step)}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {trackFinished(track) ? (
              <Button
                type="button"
                className="h-11 text-base"
                disabled={busy}
                onClick={() =>
                  startEditing(
                    nextTrackProposal(track, exercise.weight_step),
                    0,
                  )
                }
              >
                Новая линейка выше
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="h-11 text-base"
              disabled={busy}
              onClick={() => startEditing(track.steps, track.position)}
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
          onClick={() => {
            const start = exercise.current_max?.max_weight ?? null;
            startEditing(
              start != null && start > 0
                ? generateTrackSteps({
                    start: Math.max(
                      exercise.weight_step,
                      Math.round((start * 0.8) / exercise.weight_step) *
                        exercise.weight_step,
                    ),
                    step: exercise.weight_step,
                    count: DEFAULT_TRACK_LENGTH,
                    weightStep: exercise.weight_step,
                  })
                : [],
              0,
            );
          }}
        >
          Задать линейку
        </Button>
      ) : null}

      {editing ? (
        <div className="flex flex-col gap-3" data-field-group>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Веса через запятую, до {MAX_TRACK_STEPS} шагов
            </span>
            <Input
              aria-label="Веса линейки"
              value={stepsText}
              placeholder="80, 82.5, 85, 87.5, 90, 92.5"
              inputMode="decimal"
              enterKeyHint="next"
              className="h-12 text-base tabular-nums"
              disabled={busy}
              onChange={(event) => setStepsText(event.target.value)}
            />
          </div>
          {parsedSteps.length > 0 ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Следующая тренировка — шаг
              </span>
              <select
                className="native-select field-control h-12 w-full rounded-xl border border-input/70 bg-input-bg pl-2.5 pr-10 text-base outline-none"
                value={safePosition}
                disabled={busy}
                onChange={(event) => setPosition(Number(event.target.value))}
              >
                {parsedSteps.map((step, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: option value is the step index itself
                  <option key={`${index}-${step}`} value={index}>
                    {index + 1} · {formatWeight(step)} кг
                  </option>
                ))}
                <option value={parsedSteps.length}>линейка пройдена</option>
              </select>
            </label>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-11 flex-1 text-base"
              disabled={busy || parsedSteps.length === 0}
              onClick={() => void save()}
            >
              {busy ? "Сохранение…" : "Сохранить линейку"}
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
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </section>
  );
}

function parseStepsText(text: string): number[] {
  return text
    .split(/[,;\s]+/)
    .map((part) => parseDecimal(part))
    .filter((value): value is number => value != null && value > 0)
    .slice(0, MAX_TRACK_STEPS);
}

function readTrack(data: unknown): ExerciseTrack | null {
  const exercise = parseExerciseWithMax(isRecord(data) ? data.exercise : null);
  return exercise?.track ?? null;
}
