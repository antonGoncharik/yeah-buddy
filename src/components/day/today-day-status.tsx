"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
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
  logFoodHref = null,
  className,
}: {
  protein: number;
  targetProtein: number;
  kcal: number;
  targetKcal: number;
  gym: Pick<GymLoop, "kind" | "label" | "href">;
  isTrainingDay: boolean;
  logFoodHref?: string | null;
  className?: string;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const glance = buildTodayDayGlance({
    protein,
    targetProtein,
    kcal,
    targetKcal,
    gym,
    isTrainingDay,
  });

  if (glance.done) {
    return (
      <p
        className={cn(
          "animate-rise px-1 text-sm leading-snug text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">День в порядке.</span> На
        сегодня хватит.
      </p>
    );
  }

  const gymSession = gym.kind === "open" || gym.kind === "queue";
  const pillars = gymSession ? glance.pillars.slice(0, 2) : glance.pillars;

  const pillarHref = (pillar: TodayGlancePillar, index: number) => {
    if (index === 2) {
      return gym.href;
    }
    if (!logFoodHref || pillar.state === "ok") {
      return null;
    }
    if (index === 0 && pillar.label === "Белок") {
      return logFoodHref;
    }
    if (index === 1 && pillar.label === "Ккал" && pillar.state === "warn") {
      return logFoodHref;
    }
    return null;
  };

  return (
    <div
      className={cn(
        "card-surface animate-rise flex flex-col px-5",
        compact ? "gap-2 py-2" : "gap-3 py-3",
        className,
      )}
    >
      <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
        <p className="text-sm font-medium">{glance.title}</p>
        {glance.lead ? (
          <p
            className={cn(
              "leading-snug text-muted-foreground",
              compact ? "text-sm" : "text-base",
            )}
          >
            {glance.lead}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "grid",
          compact ? "gap-1.5" : "gap-2",
          gymSession ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {pillars.map((pillar, index) => (
          <GlancePillar
            key={pillar.label}
            pillar={pillar}
            href={pillarHref(pillar, index)}
          />
        ))}
      </div>
      {gymSession ? <GymSessionRow label={gym.label} href={gym.href} /> : null}
    </div>
  );
}

function GymSessionRow({
  label,
  href,
}: {
  label: string;
  href: string | null;
}) {
  const shell = (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/10 px-2.5 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">Зал</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug tracking-tight">
          {label}
        </p>
      </div>
      {href ? (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      ) : null}
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
