"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

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
  type CatalogExerciseDetail,
  type CatalogExerciseSummary,
  catalogExerciseDisplayName,
  parseCatalogExercisePayload,
} from "@/lib/workout/exercise-catalog-map";
import { parseExerciseWithMax } from "@/lib/workout/map-exercise";

const STEP_PREVIEW = 3;

export function ExerciseTechniquePanel({
  exercise,
  onLinked,
}: {
  exercise: ExerciseWithMax;
  onLinked: (next: ExerciseWithMax) => void;
}) {
  const searchInputId = useId();
  const linked = exercise.catalog_exercise_id != null;
  const [pickerOpen, setPickerOpen] = useState(!linked);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const catalog = useCatalogExerciseSearch(query);
  const showResults = catalogExerciseSearchActive(query);

  async function linkCatalog(item: CatalogExerciseSummary | null) {
    setPendingId(item?.id ?? "unlink");
    setLinkError(null);
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
      setPickerOpen(next.catalog_exercise_id == null);
    } catch {
      setLinkError(LOAD_FAILED);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <h2 className="text-lg font-semibold tracking-tight">Как делать</h2>

      {linked && exercise.catalog_exercise_id ? (
        <TechniquePreview
          catalogExerciseId={exercise.catalog_exercise_id}
          pickerOpen={pickerOpen}
          onOpenPicker={() => setPickerOpen(true)}
        />
      ) : null}

      {!linked || pickerOpen ? (
        <div className="flex flex-col gap-3">
          {!linked ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
              <Search className="size-4 shrink-0" aria-hidden />
              <span>Например: выпады, squat, жим лёжа</span>
            </div>
          ) : null}
          <Input
            id={searchInputId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск в каталоге"
            className="h-12 text-base"
            inputMode="search"
            enterKeyHint="search"
          />
          {linkError ? (
            <p className="text-sm text-destructive">{linkError}</p>
          ) : null}
          {showResults && catalog.loading ? (
            <p className="text-sm text-muted-foreground">Ищем…</p>
          ) : null}
          {showResults && catalog.exercises.length > 0 ? (
            <ul className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background">
              {catalog.exercises.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={pendingId != null}
                    className="flex w-full flex-col gap-0.5 px-3 py-3 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 disabled:opacity-60"
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
          {linked && pickerOpen ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 self-start text-base"
              onClick={() => {
                setPickerOpen(false);
                setQuery("");
              }}
            >
              Отмена
            </Button>
          ) : null}
        </div>
      ) : null}

      {linked && !pickerOpen ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 text-base"
            onClick={() => setPickerOpen(true)}
          >
            Заменить
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-base"
            disabled={pendingId != null}
            onClick={() => void linkCatalog(null)}
          >
            Отвязать
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function TechniquePreview({
  catalogExerciseId,
  pickerOpen,
  onOpenPicker,
}: {
  catalogExerciseId: string;
  pickerOpen: boolean;
  onOpenPicker: () => void;
}) {
  const [detail, setDetail] = useState<CatalogExerciseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/catalog-exercises/${catalogExerciseId}`,
        );
        if (!response.ok) {
          throw new Error("load failed");
        }
        const parsed = parseCatalogExercisePayload(await response.json());
        if (!parsed) {
          throw new Error("load failed");
        }
        if (!cancelled) {
          setDetail(parsed);
          setStepsExpanded(false);
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setError(LOAD_FAILED);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [catalogExerciseId]);

  if (pickerOpen) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="size-[11rem] animate-pulse rounded-2xl bg-muted" />
        <p className="text-sm text-muted-foreground">Загружаем гифку…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">{error ?? LOAD_FAILED}</p>
        <Button
          type="button"
          variant="secondary"
          className="h-11 self-start text-base"
          onClick={onOpenPicker}
        >
          Выбрать другое
        </Button>
      </div>
    );
  }

  const steps =
    detail.instruction_steps.ru ?? detail.instruction_steps.en ?? [];
  const visibleSteps = stepsExpanded ? steps : steps.slice(0, STEP_PREVIEW);
  const hiddenCount = steps.length - visibleSteps.length;
  const gifOk =
    detail.gif_url.length > 0 && !detail.gif_url.includes("undefined");

  return (
    <div className="flex flex-col gap-4">
      {gifOk ? (
        <div className="mx-auto w-full max-w-[12.5rem] overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/40">
          {/* biome-ignore lint/performance/noImgElement: animated gif from external catalog cdn */}
          <img
            src={detail.gif_url}
            alt=""
            width={200}
            height={200}
            loading="eager"
            decoding="async"
            className="h-auto w-full"
          />
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Гифка недоступна — попробуй заменить упражнение в каталоге.
        </p>
      )}
      {steps.length > 0 ? (
        <div className="flex flex-col gap-2">
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
            {visibleSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="flex items-center gap-1 self-start text-sm font-medium text-primary"
              onClick={() => setStepsExpanded(true)}
            >
              Ещё {hiddenCount}{" "}
              {hiddenCount === 1 ? "шаг" : hiddenCount < 5 ? "шага" : "шагов"}
              <ChevronDown className="size-4" aria-hidden />
            </button>
          ) : null}
          {stepsExpanded && steps.length > STEP_PREVIEW ? (
            <button
              type="button"
              className="self-start text-sm font-medium text-muted-foreground"
              onClick={() => setStepsExpanded(false)}
            >
              Свернуть
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function readExercisePayload(data: unknown): ExerciseWithMax | null {
  return parseExerciseWithMax(isRecord(data) ? data.exercise : null);
}
