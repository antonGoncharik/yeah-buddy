"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  catalogExerciseSearchActive,
  useCatalogExerciseSearch,
} from "@/components/workout/use-catalog-exercise-search";
import { patchJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type { ExerciseWithMax } from "@/lib/types";
import {
  type CatalogExerciseSummary,
  catalogExerciseDisplayName,
} from "@/lib/workout/exercise-catalog-map";
import { parseExerciseWithMax } from "@/lib/workout/map-exercise";

export function ExerciseCatalogLinkSection({
  exercise,
  onLinked,
  searchInputId,
}: {
  exercise: ExerciseWithMax;
  onLinked: (next: ExerciseWithMax) => void;
  searchInputId?: string;
}) {
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const catalog = useCatalogExerciseSearch(query);
  const showResults = catalogExerciseSearchActive(query);

  async function linkCatalog(item: CatalogExerciseSummary | null) {
    setPendingId(item?.id ?? "unlink");
    setError(null);
    try {
      const data = await patchJson(
        `/api/exercises/${exercise.id}/catalog-link`,
        {
          catalog_exercise_id: item?.id ?? null,
        },
      );
      const next = readExercisePayload(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      onLinked(next);
      setQuery("");
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">Каталог</p>
        <p className="text-sm text-muted-foreground">
          {exercise.catalog_exercise_id
            ? "Связано с библиотекой техники. Можно заменить или отвязать."
            : "Найди похожее упражнение в библиотеке (на русском или английском)."}
        </p>
      </div>

      <Input
        id={searchInputId}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск: жим, squat, тяга…"
        className="h-12 text-base"
        enterKeyHint="search"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showResults && catalog.loading ? (
        <p className="text-sm text-muted-foreground">Ищем…</p>
      ) : null}

      {showResults && catalog.exercises.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {catalog.exercises.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pendingId != null}
                className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-muted disabled:opacity-60"
                onClick={() => void linkCatalog(item)}
              >
                <span className="text-base font-medium">
                  {catalogExerciseDisplayName(item, "ru")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.name_en}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {exercise.catalog_exercise_id ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 self-start text-base"
          disabled={pendingId != null}
          onClick={() => void linkCatalog(null)}
        >
          Отвязать каталог
        </Button>
      ) : null}
    </section>
  );
}

function readExercisePayload(data: unknown): ExerciseWithMax | null {
  return parseExerciseWithMax(isRecord(data) ? data.exercise : null);
}
