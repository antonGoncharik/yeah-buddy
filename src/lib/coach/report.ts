import type { CoachGymTone } from "@/lib/coach/types";
import type { SessionStatus, WorkoutSet } from "@/lib/types";
import {
  formatSetLine,
  setWasWritten,
  workMeetsPlan,
} from "@/lib/workout/session-format";

const SLACK_LINE_LIMIT = 4;

export interface CoachGymReport {
  tone: CoachGymTone;
  headline: string;
  lines: string[];
}

export function proteinLeftShort(fact: number, target: number): boolean {
  if (!(target > 0) || !(fact > 0)) {
    return false;
  }

  return fact / target < 0.85;
}

export function coachGymReport(input: {
  status: SessionStatus | "none";
  date: string;
  today: string;
  exercises: Array<{ name: string; sets: WorkoutSet[] }>;
}): CoachGymReport {
  if (input.status === "none") {
    return { tone: "none", headline: "Зала нет", lines: [] };
  }

  if (input.status === "skipped") {
    return { tone: "miss", headline: "Пропустил", lines: [] };
  }

  if (input.status === "planned") {
    return input.date < input.today
      ? { tone: "miss", headline: "Не закрыл", lines: [] }
      : { tone: "open", headline: "Ещё не закрыл", lines: [] };
  }

  const lines = slackLines(input.exercises);
  if (lines.length > 0) {
    return { tone: "short", headline: "Ниже плана", lines };
  }

  const wrote = input.exercises.some((item) =>
    item.sets.some((set) => set.set_type === "work" && setWasWritten(set)),
  );
  return {
    tone: "ok",
    headline: wrote ? "Сделал" : "По плану",
    lines: [],
  };
}

function slackLines(
  exercises: Array<{ name: string; sets: WorkoutSet[] }>,
): string[] {
  const lines: string[] = [];
  for (const item of exercises) {
    for (const set of item.sets) {
      if (set.set_type !== "work" || !setWasWritten(set)) {
        continue;
      }
      if (workMeetsPlan(set) !== false) {
        continue;
      }
      lines.push(slackLine(item.name, set));
      if (lines.length >= SLACK_LINE_LIMIT) {
        return lines;
      }
    }
  }
  return lines;
}

function slackLine(name: string, set: WorkoutSet): string {
  const actual = formatSetLine(set, { showActual: true, compact: true });
  const planned = formatSetLine(set, { showActual: false, compact: true });
  if (actual === planned) {
    return `${name} ${actual}`;
  }
  return `${name} ${actual} · план ${planned}`;
}
