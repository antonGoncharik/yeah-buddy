"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExerciseTrackMutations } from "@/components/workout/use-exercise-track-mutations";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";
import { trackCurrentWeight } from "@/lib/workout/track-line";
import { BAR_KG_FIELD } from "@/lib/workout/user-copy";

export function ExerciseTrackStandaloneCard({
  exercise,
}: {
  exercise: ExerciseWithMax;
}) {
  const mutations = useExerciseTrackMutations({
    exerciseId: exercise.id,
    initialTrack: exercise.track,
  });
  const [editing, setEditing] = useState(false);
  const [weightText, setWeightText] = useState("");

  const current = mutations.track ? trackCurrentWeight(mutations.track) : null;
  const parsed = mutations.parseWeight(weightText);

  function startEditing(kg: number | null) {
    setWeightText(kg != null && kg > 0 ? formatWeight(kg) : "");
    setEditing(true);
    mutations.setError(null);
  }

  async function save() {
    if (parsed == null || parsed <= 0) {
      mutations.setError("Нужны килограммы на штанге.");
      return;
    }
    const ok = await mutations.saveWeight(parsed, () => {});
    if (ok) {
      setEditing(false);
    }
  }

  async function remove() {
    const ok = await mutations.removeTrack();
    if (ok) {
      setEditing(false);
    }
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="text-base font-medium">{BAR_KG_FIELD}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Лесенка: эти килограммы идут на штангу. Дальше плюс шаг после недели
          или после тренировки. «На раз» тут ни при чём.
        </p>
      </div>

      {mutations.track && !editing ? (
        <>
          <p className="text-lg font-semibold tracking-tight tabular-nums">
            {current != null ? `${formatWeight(current)} кг` : "нет"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 text-base"
              disabled={mutations.busy}
              onClick={() => startEditing(current)}
            >
              Поправить
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base text-muted-foreground"
              disabled={mutations.busy}
              onClick={() => void remove()}
            >
              Убрать
            </Button>
          </div>
        </>
      ) : null}

      {!mutations.track && !editing ? (
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
            aria-label={BAR_KG_FIELD}
            value={weightText}
            inputMode="decimal"
            enterKeyHint="done"
            className="h-12 text-base tabular-nums"
            disabled={mutations.busy}
            onChange={(event) => setWeightText(event.target.value)}
          />
          {mutations.error ? (
            <p className="text-base leading-snug text-destructive">
              {mutations.error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-11 flex-1 text-base"
              disabled={mutations.busy || parsed == null || parsed <= 0}
              onClick={() => void save()}
            >
              {mutations.busy ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-base"
              disabled={mutations.busy}
              onClick={() => setEditing(false)}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      {!editing && mutations.error ? (
        <p className="text-base leading-snug text-destructive">
          {mutations.error}
        </p>
      ) : null}
    </section>
  );
}
