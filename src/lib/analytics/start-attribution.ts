import { parseBuddyStartPayload } from "@/lib/buddy/start";
import { parseCoachStartPayload } from "@/lib/coach/start";
import { parseMealDraftStartPayload } from "@/lib/meal-chat/start";
import { parseBarbellStartPayload } from "@/lib/share/barbell-start";
import { parseProgramStartPayload } from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";

export const FIRST_START_KINDS = [
  "program",
  "pack",
  "coach",
  "buddy",
  "barbell",
  "meal",
] as const;

export type FirstStartKind = (typeof FIRST_START_KINDS)[number];

export function classifyStartAttribution(
  raw: string,
): { kind: FirstStartKind; ref: string } | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const coach = parseCoachStartPayload(value);
  if (coach) {
    return { kind: "coach", ref: value };
  }

  const buddy = parseBuddyStartPayload(value);
  if (buddy) {
    return { kind: "buddy", ref: value };
  }

  const meal = parseMealDraftStartPayload(value);
  if (meal) {
    return { kind: "meal", ref: value };
  }

  if (parseBarbellStartPayload(value)) {
    return { kind: "barbell", ref: value };
  }

  const program = parseProgramStartPayload(value);
  if (program) {
    return { kind: "program", ref: value };
  }

  if (isPackToken(value)) {
    return { kind: "pack", ref: value };
  }

  return null;
}
