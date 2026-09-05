"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  LOAD_FAILED,
  readApiError,
  WORKOUTS_NEED_EXERCISES,
  WORKOUTS_NEED_TEMPLATES,
} from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PHASE_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function WorkoutsHubScreen() {
  const date = format(new Date(), "yyyy-MM-dd");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[]>([]);
  const [macro, setMacro] = useState<CurrentMacroState | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionTemplate, setSessionTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [nextTemplate, setNextTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [followingTemplate, setFollowingTemplate] =
    useState<WorkoutTemplateDetail | null>(null);
  const [recent, setRecent] = useState<RecentWorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        exercisesResponse,
        templatesResponse,
        macroResponse,
        todayResponse,
      ] = await Promise.all([
        fetch("/api/exercises?filter=active"),
        fetch("/api/templates"),
        fetch("/api/macros"),
        fetch(`/api/sessions?date=${encodeURIComponent(date)}`),
      ]);
      if (
        !exercisesResponse.ok ||
        !templatesResponse.ok ||
        !macroResponse.ok ||
        !todayResponse.ok
      ) {
        throw new Error("load failed");
      }

      const exercisesData: unknown = await exercisesResponse.json();
      const templatesData: unknown = await templatesResponse.json();
      const macroData: unknown = await macroResponse.json();
      const todayData: unknown = await todayResponse.json();
      setExercises(readExercises(exercisesData));
      setTemplates(readTemplates(templatesData));
      setMacro(readMacro(macroData));
      setSession(readTodaySession(todayData));
      setSessionTemplate(readTemplate(todayData, "session_template"));
      setNextTemplate(readTemplate(todayData, "next_template"));
      setFollowingTemplate(readTemplate(todayData, "following_template"));
      setRecent(readRecent(todayData));
    } catch {
      setError(LOAD_FAILED);
      setExercises([]);
      setTemplates([]);
      setMacro(null);
      setSession(null);
      setSessionTemplate(null);
      setNextTemplate(null);
      setFollowingTemplate(null);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createToday(templateId: string) {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_date: date,
          template_id: templateId,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      await load();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setCreating(false);
    }
  }

  async function skipTemplate(templateId: string) {
    setSkipping(true);
    setError(null);

    try {
      const response = await fetch("/api/rotation/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      await load();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSkipping(false);
    }
  }

  const todayLabel = format(new Date(), "d MMMM", { locale: ru });
  const sessionAction =
    session?.status === "completed"
      ? SESSION_STATUS_LABELS.completed
      : session?.status === "skipped"
        ? SESSION_STATUS_LABELS.skipped
        : "Открыть";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_EXERCISES}</p>
            <Link
              href="/workouts/exercises/new"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Добавить упражнение
            </Link>
          </section>
        ) : null}

        {!loading &&
        !error &&
        !session &&
        exercises.length > 0 &&
        !nextTemplate ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_TEMPLATES}</p>
            <Link
              href="/workouts/schedule"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Собрать шаблоны
            </Link>
          </section>
        ) : null}

        {!loading && !error && session ? (
          <Link
            href={`/workouts/sessions/${session.id}`}
            className="card-surface animate-rise block px-5 py-6 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm font-medium text-muted-foreground">Сегодня</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">
              {sessionTemplate?.name ??
                WORKOUT_KIND_LABELS[session.workout_type]}
            </h2>
            <p
              className={
                session.status === "planned"
                  ? "mt-3 text-base font-medium text-primary"
                  : "mt-3 text-base text-muted-foreground"
              }
            >
              {sessionAction}
            </p>
            {session.status === "completed" && nextTemplate ? (
              <p className="mt-2 text-base text-muted-foreground">
                Дальше {nextTemplate.name}
              </p>
            ) : null}
            {session.status === "planned" && followingTemplate ? (
              <p className="mt-2 text-base text-muted-foreground">
                Потом {followingTemplate.name}
              </p>
            ) : null}
          </Link>
        ) : null}

        {!loading && !error && !session && nextTemplate ? (
          <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Следующая
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {nextTemplate.name}
              </h2>
              {followingTemplate ? (
                <p className="mt-2 text-base text-muted-foreground">
                  Потом {followingTemplate.name}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className="h-14 text-lg"
              disabled={creating || skipping}
              onClick={() => void createToday(nextTemplate.id)}
            >
              Начать
            </Button>
            {activeTemplates.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={creating || skipping}
                onClick={() => void skipTemplate(nextTemplate.id)}
              >
                Не это, следующая
              </Button>
            ) : null}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Не идёшь сегодня — ничего не нажимай. Завтра снова она.
            </p>
          </section>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <div
            className="animate-rise flex flex-col gap-5"
            style={{ animationDelay: "40ms" }}
          >
            {macro?.macro && macro.phase ? (
              <Link
                href="/workouts/macro"
                className="flex items-baseline justify-between gap-3 px-1 text-sm"
              >
                <span className="text-muted-foreground">Макроцикл</span>
                <span>
                  №{macro.macro.number} ·{" "}
                  {PHASE_TYPE_LABELS[macro.phase.phase_type]}
                </span>
              </Link>
            ) : (
              <Link
                href="/workouts/macro/new"
                className="px-1 text-sm text-muted-foreground"
              >
                Фазы макроцикла
              </Link>
            )}

            {activeTemplates.length > 0 ? (
              <Link
                href="/workouts/schedule"
                className="flex items-baseline justify-between gap-3 px-1"
              >
                <h2 className="text-lg font-semibold">Очередь</h2>
                <span className="text-sm font-medium text-primary">
                  Изменить
                </span>
              </Link>
            ) : (
              <Link
                href="/workouts/schedule"
                className="text-sm font-medium text-primary"
              >
                Собрать очередь
              </Link>
            )}

            <Link
              href="/workouts/exercises"
              className="flex items-baseline justify-between gap-3 px-1 text-sm"
            >
              <span className="text-muted-foreground">Упражнения</span>
              <span className="font-medium text-primary">Все</span>
            </Link>
          </div>
        ) : null}

        {!loading && !error && recent.length > 0 ? (
          <section
            className="animate-rise flex flex-col gap-3 px-1"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="text-lg font-semibold">Недавние</h2>
            <ul className="flex flex-col gap-2.5">
              {recent.map((item) => (
                <li
                  key={item.session.id}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="truncate text-base">
                    {item.template_name ??
                      WORKOUT_KIND_LABELS[item.session.workout_type]}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatSessionDay(item.session.session_date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
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

function readMacro(data: unknown): CurrentMacroState | null {
  if (!data || typeof data !== "object" || !("macro" in data)) {
    return null;
  }

  return data as CurrentMacroState;
}

function readTodaySession(data: unknown): WorkoutSession | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data.session as WorkoutSession;
}

function readTemplate(
  data: unknown,
  key: "next_template" | "session_template" | "following_template",
): WorkoutTemplateDetail | null {
  if (!data || typeof data !== "object" || !(key in data)) {
    return null;
  }

  const value = (data as Record<string, unknown>)[key];
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as WorkoutTemplateDetail;
}

function readRecent(data: unknown): RecentWorkoutSession[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("recent" in data) ||
    !Array.isArray(data.recent)
  ) {
    return [];
  }

  return data.recent as RecentWorkoutSession[];
}

function formatSessionDay(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
