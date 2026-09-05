import Link from "next/link";

import type { WorkoutSession, WorkoutTemplateDetail } from "@/lib/types";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export type TodayWorkoutBannerState = {
  href: string;
  label: string;
  title: string;
  hint: string | null;
};

export function TodayWorkoutBanner({
  href,
  title,
  hint,
  label = "В зале",
}: {
  href: string;
  title: string;
  hint?: string | null;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="card-surface animate-rise block px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{title}</p>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </Link>
  );
}

export function bannerFromTodayState(
  data: unknown,
  showNext: boolean,
): TodayWorkoutBannerState | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const session =
    record.session && typeof record.session === "object"
      ? (record.session as WorkoutSession)
      : null;
  const tableSession =
    record.table_session && typeof record.table_session === "object"
      ? (record.table_session as WorkoutSession)
      : null;
  const sessionTemplate = readNamed(record.session_template);
  const nextTemplate = readNamed(record.next_template);

  if (session) {
    return {
      href: `/workouts/sessions/${session.id}`,
      label: "В зале",
      title: sessionTemplate?.name ?? WORKOUT_KIND_LABELS[session.workout_type],
      hint: SESSION_STATUS_LABELS[session.status],
    };
  }

  if (tableSession) {
    return {
      href: `/workouts/sessions/${tableSession.id}`,
      label: "Стол",
      title:
        tableSession.status === "completed"
          ? (tableSession.note ?? "Стол")
          : "На сегодня",
      hint: SESSION_STATUS_LABELS[tableSession.status],
    };
  }

  if (nextTemplate && showNext) {
    return {
      href: "/workouts",
      label: "В зале",
      title: nextTemplate.name,
      hint: "Начни, если идёшь в зал",
    };
  }

  return null;
}

function readNamed(value: unknown): WorkoutTemplateDetail | null {
  if (!value || typeof value !== "object" || !("name" in value)) {
    return null;
  }

  return value as WorkoutTemplateDetail;
}
