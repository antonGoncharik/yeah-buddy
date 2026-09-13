"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { SetDraft } from "@/components/workout/session-drafts";
import { SessionExerciseRow } from "@/components/workout/session-exercise-row";
import { SortableList } from "@/components/workout/sortable-list";
import { SESSION_PLAN_EMPTY } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
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
  onReorder,
  onStartRest,
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
  onReorder?: (exerciseIds: string[]) => void;
  onStartRest?: (exerciseId: string) => void;
  lastRestSeconds?: (exerciseId: string) => number;
}) {
  const session = detail.session;
  const canReorder = Boolean(onReorder) && canEditSets;

  if (detail.exercises.length === 0) {
    return (
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
    );
  }

  return (
    <section className="card-surface animate-rise">
      <SortableList
        items={detail.exercises}
        disabled={busy || !canReorder}
        onReorder={(next) => onReorder?.(next.map((item) => item.id))}
        renderItem={(item) => (
          <SessionExerciseRow
            item={item}
            compact
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
              session.status === "planned" ? () => onRemove(item.id) : undefined
            }
            restActive={restActive}
            onStartRest={
              canRest && onStartRest
                ? () => onStartRest(item.exercise_id)
                : undefined
            }
            restSeconds={lastRestSeconds?.(item.exercise_id)}
          />
        )}
      />
    </section>
  );
}
