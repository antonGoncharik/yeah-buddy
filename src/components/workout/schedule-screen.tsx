"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function ScheduleScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function move(id: string, direction: -1 | 1) {
    const index = templates.findIndex((template) => template.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= templates.length) {
      return;
    }

    const next = [...templates];
    const current = next[index];
    const swap = next[nextIndex];
    if (!current || !swap) {
      return;
    }

    next[index] = swap;
    next[nextIndex] = current;
    setTemplates(next);
    void save(next);
  }

  function toggle(id: string) {
    const next = templates.map((template) =>
      template.id === id
        ? { ...template, is_active: !template.is_active }
        : template,
    );
    setTemplates(next);
    void save(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Круг" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <p className="text-base text-muted-foreground">
          Порядок активных шаблонов — это расписание. Фаза меняет веса, не
          состав.
        </p>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error ? (
          <div className="flex flex-col items-center gap-3 py-12">
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
          <p className="text-base text-muted-foreground">
            Шаблонов ещё нет. Соберите первую тренировку.
          </p>
        ) : null}

        {templates.map((template, index) => (
          <section
            key={template.id}
            className="card-surface flex flex-col gap-3 px-5 py-4"
          >
            <Link href={`/workouts/templates/${template.id}`}>
              <p className="text-lg font-semibold">{template.name}</p>
              <p className="text-sm text-muted-foreground">
                {WORKOUT_KIND_LABELS[template.kind]}
                {` · ${template.exercises.length} упр.`}
                {template.is_active ? "" : " · вне круга"}
              </p>
            </Link>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={saving || index === 0}
                onClick={() => move(template.id, -1)}
              >
                Выше
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={saving || index === templates.length - 1}
                onClick={() => move(template.id, 1)}
              >
                Ниже
              </Button>
              <Button
                type="button"
                variant={template.is_active ? "secondary" : "outline"}
                className="h-11"
                disabled={saving}
                onClick={() => toggle(template.id)}
              >
                {template.is_active ? "В круге" : "Включить"}
              </Button>
            </div>
          </section>
        ))}

        <Link
          href="/workouts/templates/new"
          className={cn(buttonVariants(), "h-14 text-lg")}
        >
          Новый шаблон
        </Link>
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
