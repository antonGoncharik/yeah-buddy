"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { SortButtons } from "@/components/workout/sort-buttons";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function ScheduleScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sorting, setSorting] = useState(false);

  const active = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );
  const inactive = useMemo(
    () => templates.filter((template) => !template.is_active),
    [templates],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setTemplates(readTemplates(data));
    } catch {
      setError(LOAD_FAILED);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: WorkoutTemplateDetail[]) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rotation: next.map((template, index) => ({
            id: template.id,
            sort_order: (index + 1) * 10,
            is_active: template.is_active,
          })),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setTemplates(readTemplates(data));
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function persist(
    nextActive: WorkoutTemplateDetail[],
    nextInactive: WorkoutTemplateDetail[],
  ) {
    const next = [...nextActive, ...nextInactive];
    setTemplates(next);
    void save(next);
  }

  function move(id: string, direction: -1 | 1) {
    const index = active.findIndex((template) => template.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= active.length) {
      return;
    }

    const nextActive = [...active];
    const current = nextActive[index];
    const swap = nextActive[nextIndex];
    if (!current || !swap) {
      return;
    }

    nextActive[index] = swap;
    nextActive[nextIndex] = current;
    persist(nextActive, inactive);
  }

  function setInCircle(id: string, inCircle: boolean) {
    if (inCircle) {
      const template = inactive.find((item) => item.id === id);
      if (!template) {
        return;
      }
      persist(
        [...active, { ...template, is_active: true }],
        inactive.filter((item) => item.id !== id),
      );
      return;
    }

    const template = active.find((item) => item.id === id);
    if (!template) {
      return;
    }
    persist(
      active.filter((item) => item.id !== id),
      [{ ...template, is_active: false }, ...inactive],
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Шаблоны" backHref="/workouts" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? (
          <p className="animate-fade py-12 text-center text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && templates.length === 0 ? (
          <p className="animate-fade text-center text-base leading-relaxed text-muted-foreground">
            Соберите первую тренировку — это и будет шаблон.
          </p>
        ) : null}

        {!loading && active.length > 0 ? (
          <section className="animate-rise flex flex-col gap-2">
            {active.length > 1 ? (
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  className="text-sm font-medium text-primary"
                  onClick={() => setSorting((current) => !current)}
                >
                  {sorting ? "Готово" : "Порядок"}
                </button>
              </div>
            ) : null}
            <div className="card-surface overflow-hidden">
              {active.map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-center gap-1 border-b border-border/70 px-2 py-1 last:border-b-0"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold tabular-nums">
                    {index + 1}
                  </span>
                  <Link
                    href={`/workouts/templates/${template.id}`}
                    className="min-w-0 flex-1 rounded-xl px-2 py-2"
                  >
                    <p className="text-base font-medium leading-snug">
                      {template.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {WORKOUT_KIND_LABELS[template.kind]}
                      {template.exercises.length > 0
                        ? ` · ${template.exercises.length}`
                        : ""}
                    </p>
                  </Link>
                  {sorting ? (
                    <>
                      <SortButtons
                        disabled={saving}
                        disableUp={index === 0}
                        disableDown={index === active.length - 1}
                        onUp={() => move(template.id, -1)}
                        onDown={() => move(template.id, 1)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="size-11"
                        disabled={saving}
                        aria-label="Убрать из круга"
                        onClick={() => setInCircle(template.id, false)}
                      >
                        <Minus className="size-5" />
                      </Button>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && inactive.length > 0 ? (
          <section className="animate-rise flex flex-col gap-2">
            <h2 className="px-1 text-sm font-medium text-muted-foreground">
              Не в круге
            </h2>
            <div className="card-surface overflow-hidden">
              {inactive.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-1 border-b border-border/70 px-2 py-1 last:border-b-0"
                >
                  <Link
                    href={`/workouts/templates/${template.id}`}
                    className="min-w-0 flex-1 rounded-xl px-3 py-2"
                  >
                    <p className="text-base font-medium leading-snug">
                      {template.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {WORKOUT_KIND_LABELS[template.kind]}
                      {template.exercises.length > 0
                        ? ` · ${template.exercises.length}`
                        : ""}
                    </p>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11"
                    disabled={saving}
                    aria-label="Вернуть в круг"
                    onClick={() => setInCircle(template.id, true)}
                  >
                    <Plus className="size-5" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading ? (
          <Link
            href="/workouts/templates/new"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "h-14 text-lg",
            )}
          >
            Новый шаблон
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function readTemplates(data: unknown): WorkoutTemplateDetail[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("templates" in data) ||
    !Array.isArray(data.templates)
  ) {
    return [];
  }

  return data.templates as WorkoutTemplateDetail[];
}
