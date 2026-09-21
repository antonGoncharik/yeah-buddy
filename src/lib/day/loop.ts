import { PROTEIN_CLOSED_LABEL, proteinClosed } from "@/lib/flavor";
import { formatGrams } from "@/lib/nutrition";
import { isRecord } from "@/lib/read";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import { parseWorkoutSession } from "@/lib/workout/map-rows";

export interface GymLoop {
  kind: "rest" | "queue" | "open" | "done";
  label: string;
  href: string | null;
  templateId: string | null;
}

export function proteinLoopLine(
  remaining: number,
  factProtein: number,
): string {
  if (proteinClosed(remaining, factProtein)) {
    return PROTEIN_CLOSED_LABEL;
  }
  return `осталось ${formatGrams(Math.max(0, remaining))} г`;
}

export function gymLoopFromTodayState(
  data: unknown,
  options: { isToday: boolean; isTrainingDay: boolean },
): GymLoop {
  const session = parseWorkoutSession(isRecord(data) ? data.session : null);
  const sessionTemplate = readNamed(
    isRecord(data) ? data.session_template : null,
  );
  const nextTemplate = readNamed(isRecord(data) ? data.next_template : null);

  if (session?.status === "completed") {
    return {
      kind: "done",
      label: "Готово",
      href: `/workouts/sessions/${session.id}`,
      templateId: null,
    };
  }

  if (session && session.status !== "skipped") {
    return {
      kind: "open",
      label: sessionTemplate?.name ?? WORKOUT_KIND_LABELS[session.workout_type],
      href: `/workouts/sessions/${session.id}`,
      templateId: null,
    };
  }

  if (nextTemplate && options.isToday && options.isTrainingDay) {
    return {
      kind: "queue",
      label: nextTemplate.name,
      href: "/workouts",
      templateId: nextTemplate.id,
    };
  }

  return {
    kind: "rest",
    label: options.isTrainingDay && options.isToday ? "нет очереди" : "отдых",
    href: options.isTrainingDay && options.isToday ? "/workouts" : null,
    templateId: null,
  };
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
