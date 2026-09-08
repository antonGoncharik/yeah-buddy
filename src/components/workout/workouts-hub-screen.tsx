"use client";

import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { previousIsoDate } from "@/lib/days";
import {
  LOAD_FAILED,
  readApiError,
  WORKOUTS_NEED_EXERCISES,
  WORKOUTS_NEED_TEMPLATES,
} from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  PhaseCircleProgress,
  RecentWorkoutSession,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cn } from "@/lib/utils";
import {
  phaseEndHint,
  phaseLinkLabel,
  readPhaseCircle,
  todayWeightsHint,
} from "@/lib/workout/hints";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function WorkoutsHubScreen() {
  const router = useRouter();
  const confirm = useConfirm();
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
  const [unfinished, setUnfinished] = useState<RecentWorkoutSession[]>([]);
  const [recent, setRecent] = useState<RecentWorkoutSession[]>([]);
  const [phaseCircle, setPhaseCircle] = useState<PhaseCircleProgress | null>(
    null,
  );
  const [canUnskip, setCanUnskip] = useState(false);
  const [canBackfillYesterday, setCanBackfillYesterday] = useState(false);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.is_active),
    [templates],
  );

  const load = useCallback(async () => {
    begin();
    setError(null);
    const sessionUrl = `/api/sessions?date=${encodeURIComponent(date)}`;
    const showCached = () => done(true);

    const results = await Promise.all([
      cachedGet(
        "/api/exercises?filter=active",
        (data) => {
          setExercises(readExercises(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        "/api/templates",
        (data) => {
          setTemplates(readTemplates(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        "/api/macros",
        (data) => {
          setMacro(readMacro(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        sessionUrl,
        (data) => {
          setSession(readTodaySession(data));
          setSessionTemplate(readTemplate(data, "session_template"));
          setNextTemplate(readTemplate(data, "next_template"));
          setFollowingTemplate(readTemplate(data, "following_template"));
          setUnfinished(readUnfinished(data));
          setRecent(readRecent(data));
          setPhaseCircle(readPhaseCircle(data));
          setCanUnskip(readCanUnskip(data));
          setCanBackfillYesterday(readCanBackfillYesterday(data));
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
    ]);

    if (!results.some((ok) => ok)) {
      setError(LOAD_FAILED);
      done(false);
      return;
    }

    done(true);
  }, [begin, date, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOnDate(templateId: string, sessionDate: string) {
    setCreating(true);
    setError(null);

    try {
      const dayResponse = await fetch(
        `/api/days?date=${encodeURIComponent(sessionDate)}`,
      );
      const dayData: unknown = await dayResponse.json().catch(() => null);
      if (dayResponse.ok && isRestFoodDay(dayData)) {
        const ok = await confirm({
          message:
            sessionDate === date
              ? "День уже заведён как отдых. Сделать тренировочным и сменить цели БЖУ? Полдник не пропадёт."
              : "За этот день еда уже заведена как отдых. Сделать тренировочным и сменить цели БЖУ? Полдник не пропадёт.",
          confirmLabel: "Сделать тренировочным",
          cancelLabel: "Отмена",
        });
        if (!ok) {
          return;
        }
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_date: sessionDate,
          template_id: templateId,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      const created = readTodaySession(data);
      if (created) {
        router.push(`/workouts/sessions/${created.id}`);
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

  async function unskipLast() {
    setSkipping(true);
    setError(null);

    try {
      const response = await fetch("/api/rotation/unskip", {
        method: "POST",
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

  async function pickTemplate(template: WorkoutTemplateDetail) {
    if (session) {
      return;
    }

    if (nextTemplate && template.id !== nextTemplate.id) {
      const ok = await confirm({
        message: `Начать «${template.name}» вместо «${nextTemplate.name}»?`,
        confirmLabel: "Начать",
        cancelLabel: "Оставить",
      });
      if (!ok) {
        return;
      }
    }

    void createOnDate(template.id, date);
  }

  const todayLabel = format(new Date(), "d MMMM", { locale: ru });
  const sessionAction =
    session?.status === "completed"
      ? "Открыть"
      : session?.status === "skipped"
        ? SESSION_STATUS_LABELS.skipped
        : "Открыть";
  const phaseHint = phaseCircle ? phaseEndHint(phaseCircle) : null;
  const weightsHint = todayWeightsHint(
    macro?.phase?.phase_type ?? null,
    macro?.macro?.number ?? null,
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" subtitle={todayLabel} />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_EXERCISES}</p>
            <Link
              href="/workouts/exercises/new"
              className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
            >
              <Plus className="size-5" aria-hidden />
              Новое упражнение
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
              className={cn(buttonVariants(), "h-14 gap-2 text-lg")}
            >
              <Plus className="size-5" aria-hidden />
              Собрать очередь
            </Link>
          </section>
        ) : null}

        {!loading && !error && unfinished.length > 0 ? (
          <ul className="animate-rise flex flex-col gap-2">
            {unfinished.map((item) => (
              <li key={item.session.id}>
                <Link
                  href={`/workouts/sessions/${item.session.id}`}
                  className="card-surface flex items-center gap-3 px-5 py-5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary">
                      Не закончена ·{" "}
                      {formatSessionDay(item.session.session_date)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                      {item.template_name ??
                        WORKOUT_KIND_LABELS[item.session.workout_type]}
                    </h2>
                    <p className="mt-2 text-base text-muted-foreground">
                      Открыть и добить или убрать.
                    </p>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && !error && session ? (
          <Link
            href={`/workouts/sessions/${session.id}`}
            className="card-surface animate-rise flex items-center gap-3 px-5 py-6 transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                {session.status === "planned" ? "Сегодня в зале" : "Сегодня"}
              </p>
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
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ) : null}

        {!loading && !error && !session && nextTemplate ? (
          <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Сегодня в очереди
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {nextTemplate.name}
              </h2>
              {followingTemplate ? (
                <p className="mt-2 text-base text-muted-foreground">
                  Потом {followingTemplate.name}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {weightsHint}
              </p>
            </div>
            <Button
              type="button"
              className="h-14 text-lg"
              disabled={creating || skipping}
              onClick={() => void createOnDate(nextTemplate.id, date)}
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
                Не это
              </Button>
            ) : null}
            {canUnskip ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={creating || skipping}
                onClick={() => void unskipLast()}
              >
                Вернуть в очередь
              </Button>
            ) : null}
            {canBackfillYesterday ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={creating || skipping}
                onClick={() =>
                  void createOnDate(nextTemplate.id, previousIsoDate(date))
                }
              >
                Записать вчера
              </Button>
            ) : null}
          </section>
        ) : null}

        {!loading &&
        !error &&
        session &&
        nextTemplate &&
        canBackfillYesterday ? (
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-base text-muted-foreground"
            disabled={creating || skipping}
            onClick={() =>
              void createOnDate(nextTemplate.id, previousIsoDate(date))
            }
          >
            Записать вчера
          </Button>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <div
            className="animate-rise flex flex-col gap-6"
            style={{ animationDelay: "40ms" }}
          >
            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <h2 className="text-lg font-semibold">Макроцикл</h2>
                <Link
                  href="/workouts/macro"
                  className="text-sm font-medium text-primary"
                >
                  {macro?.macro && macro.phase ? "Открыть" : "Завести"}
                </Link>
              </div>
              {macro?.macro && macro.phase ? (
                <Link
                  href="/workouts/macro"
                  className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <p className="text-xl font-semibold tracking-tight">
                    {phaseLinkLabel(
                      macro.macro.number,
                      phaseCircle ?? macro.phase_circle,
                      macro.phase.phase_type,
                    )}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {session
                      ? "От этой фазы считаются веса сегодняшней тренировки."
                      : "От этой фазы посчитаются рабочие веса, когда начнёшь."}
                  </p>
                  {phaseHint ? (
                    <p className="text-base leading-snug">{phaseHint}</p>
                  ) : null}
                  {phaseHint ? (
                    <p className="text-base font-medium text-primary">
                      {phaseCircle?.phase_type === "deload"
                        ? "Можно закрыть макроцикл"
                        : "Можно закрыть фазу"}
                    </p>
                  ) : null}
                </Link>
              ) : (
                <p className="px-1 text-sm leading-relaxed text-muted-foreground">
                  {session
                    ? weightsHint
                    : "Необязателен. Без него очередь всё равно идёт."}
                </p>
              )}
            </section>

            {activeTemplates.length > 0 ? (
              <section className="flex flex-col gap-2">
                <Link
                  href="/workouts/schedule"
                  className="flex items-center justify-between gap-3 px-1"
                >
                  <h2 className="text-lg font-semibold">Очередь</h2>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
                <p className="px-1 text-sm leading-relaxed text-muted-foreground">
                  Порядок тренировок по кругу, не дни недели. Нажми имя — начать
                  не следующее.
                </p>
                <ol className="flex flex-col gap-1 px-1">
                  {activeTemplates.map((template, index) => {
                    const isNext = nextTemplate?.id === template.id;
                    const label = `${index + 1}. ${template.name}`;
                    if (session) {
                      return (
                        <li
                          key={template.id}
                          className={
                            isNext
                              ? "text-base font-medium"
                              : "text-base text-muted-foreground"
                          }
                        >
                          {label}
                          {isNext ? " · сегодня" : ""}
                        </li>
                      );
                    }

                    return (
                      <li key={template.id}>
                        <button
                          type="button"
                          className={cn(
                            "w-full py-1 text-left text-base disabled:opacity-50",
                            isNext ? "font-medium" : "text-muted-foreground",
                          )}
                          disabled={creating || skipping}
                          onClick={() => void pickTemplate(template)}
                        >
                          {label}
                          {isNext ? " · дальше" : ""}
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <Link
                  href="/settings/formulas"
                  className="px-1 text-sm text-muted-foreground"
                >
                  Схема подходов — проценты разминки и рабочих
                </Link>
              </section>
            ) : (
              <Link
                href="/workouts/schedule"
                className="flex items-center gap-1 text-sm font-medium text-primary"
              >
                <Plus className="size-4" aria-hidden />
                Собрать очередь
              </Link>
            )}

            <nav className="grid grid-cols-3 gap-2">
              <Link
                href="/workouts/progress"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                Прогресс
              </Link>
              <Link
                href="/workouts/history"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                История
              </Link>
              <Link
                href="/workouts/exercises"
                className="card-surface px-2 py-3 text-center text-sm font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
              >
                Упражнения
              </Link>
            </nav>
            <Link
              href="/settings/review?from=workouts"
              className="card-surface px-5 py-4 text-base font-medium transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40 active:scale-[0.97]"
            >
              Разбор еды и зала
            </Link>
          </div>
        ) : null}

        {!loading && !error && recent.length > 0 ? (
          <section
            className="animate-rise flex flex-col gap-2 px-1"
            style={{ animationDelay: "80ms" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              Недавние
            </h2>
            <ul className="flex flex-col gap-1">
              {recent.map((item) => (
                <li key={item.session.id}>
                  <Link
                    href={`/workouts/sessions/${item.session.id}`}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="min-w-0">
                      <span className="truncate text-base">
                        {item.template_name ??
                          WORKOUT_KIND_LABELS[item.session.workout_type]}
                      </span>
                      {item.summary ? (
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {item.summary}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      {formatSessionDay(item.session.session_date)}
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                  </Link>
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

function readCanUnskip(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === "object" &&
      "can_unskip" in data &&
      data.can_unskip === true,
  );
}

function readCanBackfillYesterday(data: unknown): boolean {
  return Boolean(
    data &&
      typeof data === "object" &&
      "can_backfill_yesterday" in data &&
      data.can_backfill_yesterday === true,
  );
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

function readUnfinished(data: unknown): RecentWorkoutSession[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("unfinished" in data) ||
    !Array.isArray(data.unfinished)
  ) {
    return [];
  }

  return data.unfinished as RecentWorkoutSession[];
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

function isRestFoodDay(data: unknown): boolean {
  if (!data || typeof data !== "object" || !("day" in data) || !data.day) {
    return false;
  }

  const day = data.day as { is_training_day?: unknown };
  return day.is_training_day === false;
}
