"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import {
  type CatalogExerciseDetail,
  parseCatalogExercisePayload,
} from "@/lib/workout/exercise-catalog-map";

const STEP_PREVIEW = 3;

export function ExerciseTechniquePreview({
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
