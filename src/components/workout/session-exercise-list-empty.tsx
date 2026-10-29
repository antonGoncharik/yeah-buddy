"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SESSION_PLAN_EMPTY } from "@/lib/messages";
import type { SessionDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionExerciseListEmpty({
  detail,
}: {
  detail: SessionDetail;
}) {
  const session = detail.session;
  const canFillBelow =
    session.status === "planned" &&
    (detail.missing_maxes.length > 0 || detail.missing_tracks.length > 0);

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
      <p className="text-lg font-medium">Нет упражнений в плане</p>
      <p className="text-base leading-relaxed text-muted-foreground">
        {canFillBelow
          ? "Ни у одного упражнения ещё нет «на раз» или килограммов на штанге. Заполни выше — план посчитается."
          : SESSION_PLAN_EMPTY}
      </p>
      {session.status === "planned" && !canFillBelow ? (
        <Link
          href="/workouts/exercises"
          className={cn(buttonVariants(), "h-14 text-lg")}
        >
          Указать вес
        </Link>
      ) : null}
    </section>
  );
}
