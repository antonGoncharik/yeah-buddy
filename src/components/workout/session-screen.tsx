"use client";

import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SessionExerciseRow } from "@/components/workout/session-exercise-row";
import { useSessionScreen } from "@/components/workout/use-session-screen";
import { SESSION_PLAN_EMPTY } from "@/lib/messages";
import { gymQuote } from "@/lib/quotes";
import { cn } from "@/lib/utils";
import { QUEUE_LABEL } from "@/lib/workout/labels";

export function SessionScreen() {
  const {
    loading,
    error,
    detail,
    load,
    session,
    title,
    subtitle,
    showStickyComplete,
    canEditSets,
    busy,
    note,
    setNote,
    saveNote,
    complete,
    cancelToday,
    correcting,
    setCorrecting,
    abovePlan,
    nextName,
    phaseHint,
    openSetIds,
    setOpenSetIds,
    warmupOpen,
    setWarmupOpen,
    workOpen,
    setWorkOpen,
    drafts,
    setDrafts,
    removeExercise,
  } = useSessionScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={title} subtitle={subtitle} backHref="/workouts" />

      <div
        className={
          showStickyComplete
            ? "flex flex-col gap-5 px-4 pb-24"
            : "flex flex-col gap-5 px-4 pb-4"
        }
      >
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !detail ? (
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

        {!loading && session && detail ? (
          <>
            {detail.exercises.length === 0 ? (
              <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
                <p className="text-lg font-medium">Нет упражнений в плане</p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {SESSION_PLAN_EMPTY}
                </p>
                {session.status === "planned" ? (
                  <Link
                    href="/workouts/exercises"
                    className={cn(buttonVariants(), "h-14 text-lg")}
                  >
                    Написать веса
                  </Link>
                ) : null}
              </section>
            ) : (
              <section className="card-surface animate-rise overflow-hidden">
                {session.status === "planned" ? (
                  <p className="border-b border-border/70 px-5 py-3 text-sm text-muted-foreground">
                    Вес не тот — нажми подход. Потом «Готово».
                  </p>
                ) : null}
                {detail.exercises.map((item) => (
                  <SessionExerciseRow
                    key={item.id}
                    item={item}
                    openSetIds={openSetIds}
                    warmupOpen={warmupOpen[item.id] !== false}
                    workOpen={workOpen[item.id] !== false}
                    disabled={busy || !canEditSets}
                    showActual={session.status === "completed"}
                    drafts={drafts}
                    onOpenSets={(ids) =>
                      setOpenSetIds((current) => {
                        const same =
                          current.length === ids.length &&
                          ids.every((id) => current.includes(id));
                        return same ? [] : ids;
                      })
                    }
                    onToggleWarmup={() =>
                      setWarmupOpen((current) => ({
                        ...current,
                        [item.id]: current[item.id] === false,
                      }))
                    }
                    onToggleWork={() =>
                      setWorkOpen((current) => ({
                        ...current,
                        [item.id]: current[item.id] === false,
                      }))
                    }
                    onDraft={(setId, patch) =>
                      setDrafts((current) => ({
                        ...current,
                        [setId]: { ...current[setId], ...patch },
                      }))
                    }
                    onRemove={
                      session.status === "planned"
                        ? () => void removeExercise(item.id)
                        : undefined
                    }
                  />
                ))}
              </section>
            )}

            {session.status === "planned" ||
            (session.status === "completed" && correcting) ||
            note.trim() !== "" ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  id="session-note"
                  value={note}
                  disabled={busy || !canEditSets}
                  placeholder="Как прошло"
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => {
                    if (canEditSets) {
                      void saveNote();
                    }
                  }}
                  className="min-h-20 text-base"
                  aria-label="Заметка"
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "completed" && !correcting ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-5">
                <h2 className="text-xl font-semibold">Готово</h2>
                <p className="text-sm text-muted-foreground">
                  {gymQuote(session.id)}
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Записано. Другой вес — поправь, останется сделанной.
                </p>
                {abovePlan ? (
                  <p className="text-base leading-relaxed">
                    Где-то больше плана. Рабочий вес сам не прыгнет — это в
                    цикле.
                  </p>
                ) : null}
                {nextName ? (
                  <p className="text-base text-muted-foreground">
                    Дальше в очереди: {nextName}.
                  </p>
                ) : null}
                {phaseHint ? (
                  <p className="text-base text-muted-foreground">{phaseHint}</p>
                ) : null}
                {abovePlan ? (
                  <Link
                    href="/workouts/macro"
                    className="text-base font-medium text-primary"
                  >
                    К циклу
                  </Link>
                ) : null}
                {phaseHint && !abovePlan ? (
                  <Link
                    href="/workouts/macro"
                    className="text-base font-medium text-primary"
                  >
                    К циклу
                  </Link>
                ) : null}
                {nextName ? (
                  <Link
                    href="/workouts"
                    className="text-base font-medium text-primary"
                  >
                    {QUEUE_LABEL}
                  </Link>
                ) : (
                  <Link
                    href="/workouts"
                    className="text-base font-medium text-primary"
                  >
                    К тренировкам
                  </Link>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 text-base"
                  disabled={busy}
                  onClick={() => setCorrecting(true)}
                >
                  Поправить записанное
                </Button>
              </section>
            ) : null}

            {session.status === "completed" && correcting ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Поправь подходы и сохрани. Тренировка уже сделана.
              </p>
            ) : null}

            {session.status === "planned" || session.status === "skipped" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 text-base text-muted-foreground"
                disabled={busy}
                onClick={() => void cancelToday()}
              >
                Не получилось
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {showStickyComplete && detail ? (
        <StickyActions>
          <Button
            type="button"
            className="h-14 w-full text-lg"
            disabled={busy || detail.exercises.length === 0}
            onClick={() => void complete()}
          >
            {detail.session.status === "planned" ? "Готово" : "Сохранить"}
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}
