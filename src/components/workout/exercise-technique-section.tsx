"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import {
  type CatalogExerciseDetail,
  catalogExerciseDisplayName,
  parseCatalogExercisePayload,
} from "@/lib/workout/exercise-catalog-map";

export function ExerciseTechniqueSection({
  catalogExerciseId,
}: {
  catalogExerciseId: string;
}) {
  const [detail, setDetail] = useState<CatalogExerciseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="card-surface px-5 py-4 text-sm text-muted-foreground">
        Загружаем технику…
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="card-surface flex flex-col gap-2 px-5 py-4">
        <p className="text-base font-medium">Техника</p>
        <p className="text-sm text-muted-foreground">{error ?? LOAD_FAILED}</p>
      </div>
    );
  }

  const steps =
    detail.instruction_steps.ru ?? detail.instruction_steps.en ?? [];
  const title = catalogExerciseDisplayName(detail, "ru");

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">Техника</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <div className="mx-auto w-full max-w-[11rem] overflow-hidden rounded-xl bg-muted">
        {/* biome-ignore lint/performance/noImgElement: animated gif from external catalog cdn */}
        <img
          src={detail.gif_url}
          alt=""
          width={180}
          height={180}
          loading="lazy"
          decoding="async"
          className="h-auto w-full"
        />
      </div>
      {steps.length > 0 ? (
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-snug">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function ExerciseTechniquePlaceholder({
  onFocusSearch,
}: {
  onFocusSearch?: () => void;
}) {
  return (
    <div className="card-surface flex flex-col gap-2 px-5 py-4">
      <p className="text-base font-medium">Техника</p>
      <p className="text-sm text-muted-foreground">
        Привяжи упражнение к каталогу — покажем гифку и шаги.
      </p>
      {onFocusSearch ? (
        <Button
          type="button"
          variant="secondary"
          className="h-11 self-start text-base"
          onClick={onFocusSearch}
        >
          Выбрать из каталога
        </Button>
      ) : null}
    </div>
  );
}
