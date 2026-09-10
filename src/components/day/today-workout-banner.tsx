"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { isRecord } from "@/lib/read";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { parseWorkoutSession } from "@/lib/workout/map-rows";

export type TodayWorkoutBannerState = {
  href: string;
  label: string;
  title: string;
  hint: string | null;
  templateId: string | null;
};

export function TodayWorkoutBanner({
  href,
  title,
  hint,
  label = "В зале",
  templateId,
  busy = false,
  onStart,
}: {
  href: string;
  title: string;
  hint?: string | null;
  label?: string;
  templateId?: string | null;
  busy?: boolean;
  onStart?: (templateId: string) => void;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{title}</p>
        {hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </>
  );

  if (templateId && onStart) {
    return (
      <button
        type="button"
        disabled={busy}
        className="card-surface animate-rise flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
        onClick={() => onStart(templateId)}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="card-surface animate-rise flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      {body}
    </Link>
  );
}

export function bannerFromTodayState(
  data: unknown,
  options: { isToday: boolean; isTrainingDay: boolean },
): TodayWorkoutBannerState | null {
  const session = parseWorkoutSession(isRecord(data) ? data.session : null);
  const sessionTemplate = readNamed(
    isRecord(data) ? data.session_template : null,
  );
  const nextTemplate = readNamed(isRecord(data) ? data.next_template : null);

  if (session) {
    return {
      href: `/workouts/sessions/${session.id}`,
      label: "В зале",
      title: sessionTemplate?.name ?? WORKOUT_KIND_LABELS[session.workout_type],
      hint: SESSION_STATUS_LABELS[session.status],
      templateId: null,
    };
  }

  if (nextTemplate && options.isToday) {
    return {
      href: "/workouts",
      label: options.isTrainingDay ? "В зале" : "Следующая",
      title: nextTemplate.name,
      hint: nextTemplate.id ? "Начать" : "Открыть",
      templateId: nextTemplate.id,
    };
  }

  return null;
}

function readNamed(value: unknown): { id: string | null; name: string } | null {
  if (!isRecord(value) || typeof value.name !== "string" || value.name === "") {
    return null;
  }

  return {
    id: typeof value.id === "string" ? value.id : null,
    name: value.name,
  };
}
