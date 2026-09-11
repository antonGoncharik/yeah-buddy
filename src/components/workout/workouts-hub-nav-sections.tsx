"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import type {
  CurrentMacroState,
  PhaseCircleProgress,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { phaseLinkLabel, queueItemMark } from "@/lib/workout/hints";
import { CYCLE_LABEL, FORMULAS_LABEL, QUEUE_LABEL } from "@/lib/workout/labels";

export function WorkoutsHubNavSections({
  macro,
  session,
  sessionTemplate,
  nextTemplate,
  phaseCircle,
  phaseHint,
  activeTemplates,
  creating,
  skipping,
  onPickTemplate,
}: {
  macro: CurrentMacroState | null;
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  phaseCircle: PhaseCircleProgress | null;
  phaseHint: string | null;
  activeTemplates: WorkoutTemplateDetail[];
  creating: boolean;
  skipping: boolean;
  onPickTemplate: (template: WorkoutTemplateDetail) => void;
}) {
  return (
    <div
      className="animate-rise flex flex-col gap-6"
      style={{ animationDelay: "40ms" }}
    >
      {macro?.macro && macro.phase ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-lg font-semibold">{CYCLE_LABEL}</h2>
            <Link
              href="/workouts/macro"
              className="text-sm font-medium text-primary"
            >
              Открыть
            </Link>
          </div>
          <Link
            href="/workouts/macro"
            className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <p className="text-xl font-semibold tracking-tight">
              {phaseLinkLabel(
                macro.macro.number,
                phaseCircle ?? macro.phase_circle,
                macro.phase.phase_type,
                macro.phase.name,
              )}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {session
                ? "От неё сегодняшние веса."
                : "От неё веса, когда начнёшь."}
            </p>
            {phaseHint ? (
              <p className="text-base leading-snug">{phaseHint}</p>
            ) : null}
            {phaseHint ? (
              <p className="text-base font-medium text-primary">
                {phaseCircle?.last_in_cycle
                  ? "Можно закрыть цикл"
                  : "Можно закрыть этап"}
              </p>
            ) : null}
          </Link>
        </section>
      ) : null}

      {activeTemplates.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Link
            href="/workouts/schedule"
            className="flex items-center justify-between gap-3 px-1"
          >
            <h2 className="text-lg font-semibold">{QUEUE_LABEL}</h2>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
          {session ? null : (
            <p className="px-1 text-sm leading-relaxed text-muted-foreground">
              Нажми имя, если хочешь начать не следующее.
            </p>
          )}
          <ol className="flex flex-col gap-1 px-1">
            {activeTemplates.map((template, index) => {
              const mark = queueItemMark({
                templateId: template.id,
                sessionTemplateId: sessionTemplate?.id ?? null,
                nextTemplateId: nextTemplate?.id ?? null,
              });
              const label = `${index + 1}. ${template.name}`;
              const emphasized = mark !== "";
              if (session) {
                return (
                  <li
                    key={template.id}
                    className={
                      emphasized
                        ? "text-base font-medium"
                        : "text-base text-muted-foreground"
                    }
                  >
                    {label}
                    {mark}
                  </li>
                );
              }

              return (
                <li key={template.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full py-1 text-left text-base disabled:opacity-50",
                      emphasized ? "font-medium" : "text-muted-foreground",
                    )}
                    disabled={creating || skipping}
                    onClick={() => onPickTemplate(template)}
                  >
                    {label}
                    {mark}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : session ? (
        <Link
          href="/workouts/schedule"
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <Plus className="size-4" aria-hidden />
          Поставить программу
        </Link>
      ) : null}

      <div className="flex flex-col gap-2">
        <nav className="grid grid-cols-2 gap-2">
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
          href="/settings/formulas"
          className="px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {FORMULAS_LABEL}
        </Link>
      </div>
    </div>
  );
}
