"use client";

import Link from "next/link";

import type { GymLoop } from "@/lib/day/loop";
import {
  buildTodayDayGlance,
  type TodayGlancePillar,
} from "@/lib/day/today-glance";
import { cn } from "@/lib/utils";

export function TodayDayStatus({
  protein,
  targetProtein,
  kcal,
  targetKcal,
  gym,
  isTrainingDay,
  className,
}: {
  protein: number;
  targetProtein: number;
  kcal: number;
  targetKcal: number;
  gym: Pick<GymLoop, "kind" | "label" | "href">;
  isTrainingDay: boolean;
  className?: string;
}) {
  const glance = buildTodayDayGlance({
    protein,
    targetProtein,
    kcal,
    targetKcal,
    gym,
    isTrainingDay,
  });

  return (
    <div
      className={cn(
        "card-surface animate-rise flex flex-col gap-3 px-5 py-3",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{glance.title}</p>
        {glance.lead ? (
          <p className="text-sm leading-snug text-muted-foreground">
            {glance.lead}
          </p>
        ) : glance.title === "День в порядке" ? (
          <p className="text-sm text-muted-foreground">На сегодня хватит.</p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {glance.pillars.map((pillar, index) => (
          <GlancePillar
            key={pillar.label}
            pillar={pillar}
            href={index === 2 ? gym.href : null}
          />
        ))}
      </div>
    </div>
  );
}

function GlancePillar({
  pillar,
  href,
}: {
  pillar: TodayGlancePillar;
  href: string | null;
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted-foreground">
        {pillar.label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tracking-tight tabular-nums",
          pillar.state === "ok" && "text-foreground",
          pillar.state === "warn" && "text-foreground",
          pillar.state === "muted" && "text-muted-foreground",
        )}
      >
        {pillar.short}
      </p>
    </>
  );

  const shell = (
    <div
      className={cn(
        "min-w-0 rounded-xl px-2.5 py-2",
        pillar.state === "ok" && "bg-primary/8",
        pillar.state === "warn" && "bg-amber-500/10",
        pillar.state === "muted" && "bg-muted/50",
        href && "transition-colors active:bg-muted",
      )}
    >
      {body}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="min-w-0">
        {shell}
      </Link>
    );
  }

  return shell;
}
