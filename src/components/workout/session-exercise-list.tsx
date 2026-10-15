"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { SetDraft } from "@/components/workout/session-drafts";
import { SessionExerciseRow } from "@/components/workout/session-exercise-row";
import { SortableList } from "@/components/workout/sortable-list";
import { SESSION_PLAN_EMPTY } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail, WorkoutSet } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionExerciseList({
  detail,
  busy,
  canEditSets,
  canRest,
  restActive,
  openSetIds,
  warmupOpen,
  drafts,
  setOpenSetIds,
  setWarmupOpen,
  setDrafts,
  onRemove,
  onSwap,
  onOfferTemplate,
  onReorder,
  onStartRest,
  onToggleSet,
  onLogSet,
  onLogPlan,
  onAddSet,
  onDropSet,
  pairs,
  onPair,
  lastRestSeconds,
}: {
  detail: SessionDetail;
  busy: boolean;
  canEditSets: boolean;
  canRest: boolean;
  restActive: boolean;
  openSetIds: string[];
  warmupOpen: Record<string, boolean>;
  drafts: Record<string, SetDraft>;
  setOpenSetIds: Dispatch<SetStateAction<string[]>>;
  setWarmupOpen: Dispatch<SetStateAction<Record<string, boolean>>>;
  setDrafts: Dispatch<SetStateAction<Record<string, SetDraft>>>;
  onRemove: (sessionExerciseId: string) => void;
  onSwap?: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
  onOfferTemplate?: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
  onReorder?: (exerciseIds: string[]) => void;
  onStartRest?: (exerciseId: string) => void;
  onToggleSet?: (set: WorkoutSet, exerciseId: string) => void;
  onLogSet?: (set: WorkoutSet, exerciseId: string, draft: SetDraft) => void;
  onLogPlan?: (exerciseId: string) => void;
  onAddSet?: (sessionExerciseId: string) => void;
  onDropSet?: (setId: string) => void;
  pairs?: Record<string, string>;
  onPair?: (exerciseId: string, nextExerciseId: string) => void;
  lastRestSeconds?: (exerciseId: string) => number;
}) {
  const session = detail.session;
  const canReorder = Boolean(onReorder) && canEditSets;

  if (detail.exercises.length === 0) {
    const canFillBelow =
      session.status === "planned" &&
      (detail.missing_maxes.length > 0 || detail.missing_tracks.length > 0);
    return (
      <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
        <p className="text-lg font-medium">Нет упражнений в плане</p>
        <p className="text-base leading-relaxed text-muted-foreground">
          {canFillBelow
            ? "Ни у одного упражнения ещё нет максимума на раз или рабочего кг. Заполни ниже — план посчитается."
            : SESSION_PLAN_EMPTY}
        </p>
        {session.status === "planned" && !canFillBelow ? (
          <Link
            href="/workouts/exercises"
            className={cn(buttonVariants(), "h-14 text-lg")}
          >
            Указать максимум
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section className="card-surface animate-rise">
      <SortableList
        items={detail.exercises}
        disabled={busy || !canReorder}
        onReorder={(next) => onReorder?.(next.map((item) => item.id))}
        renderItem={(item) => {
          const peak = detail.beats?.peaks.find(
            (row) => row.exercise_id === item.exercise_id,
          );
          const index = detail.exercises.findIndex((row) => row.id === item.id);
          const nextExercise = detail.exercises[index + 1];
          const partner = detail.exercises.find(
            (row) => row.id === pairs?.[item.id],
          );
          return (
            <SessionExerciseRow
              item={item}
              compact
              priorPeak={peak?.prior_peak ?? null}
              priorOn={peak?.prior_on ?? null}
              track={
                detail.tracks.find(
                  (track) => track.exercise_id === item.exercise_id,
                ) ?? null
              }
              openSetIds={openSetIds}
              warmupOpen={warmupOpen[item.id] === true}
              disabled={busy || !canEditSets}
              showActual={session.status === "completed"}
              drafts={drafts}
              onOpenSets={(ids) =>
                setOpenSetIds((current) => {
                  const same =
                    current.length === ids.length &&
                    ids.every((id) => current.includes(id));
                  if (!same) {
                    haptic("tap");
                  }
                  return same ? [] : ids;
                })
              }
              onToggleWarmup={() =>
                setWarmupOpen((current) => ({
                  ...current,
                  [item.id]: current[item.id] !== true,
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
                  ? () => onRemove(item.id)
                  : undefined
              }
              onSwap={
                session.status === "planned" && onSwap ? onSwap : undefined
              }
              templateId={session.template_id}
              onOfferTemplate={onOfferTemplate}
              restActive={restActive}
              onStartRest={
                canRest && onStartRest
                  ? () => onStartRest(item.exercise_id)
                  : undefined
              }
              onToggleSet={
                canEditSets && onToggleSet
                  ? (set) => onToggleSet(set, item.exercise_id)
                  : undefined
              }
              onLogSet={
                canEditSets && onLogSet
                  ? (set, draft) => onLogSet(set, item.id, draft)
                  : undefined
              }
              onLogPlan={
                session.status === "planned" && onLogPlan
                  ? () => onLogPlan(item.id)
                  : undefined
              }
              onAddSet={
                session.status === "planned" && onAddSet
                  ? () => onAddSet(item.id)
                  : undefined
              }
              onDropSet={
                session.status === "planned" && onDropSet
                  ? onDropSet
                  : undefined
              }
              paired={Boolean(partner)}
              pairName={
                partner
                  ? partner.exercise.short_name || partner.exercise.name
                  : null
              }
              onPair={
                session.status === "planned" &&
                onPair &&
                (partner || nextExercise)
                  ? () => {
                      if (partner) {
                        onPair(item.id, partner.id);
                        return;
                      }
                      if (nextExercise) {
                        onPair(item.id, nextExercise.id);
                      }
                    }
                  : undefined
              }
              restSeconds={lastRestSeconds?.(item.exercise_id)}
            />
          );
        }}
      />
    </section>
  );
}
