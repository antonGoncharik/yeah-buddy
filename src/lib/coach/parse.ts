import type {
  CoachAthleteView,
  CoachBoard,
  CoachDay,
  CoachGrantView,
  CoachGym,
  CoachGymTone,
  CoachHome,
  CoachMeal,
  CoachMealLine,
} from "@/lib/coach/types";
import { isIsoDate } from "@/lib/day/dates";
import { isRecord, toNullableNumber, toNumber } from "@/lib/read";

const GYM_TONES: readonly CoachGymTone[] = [
  "ok",
  "short",
  "miss",
  "open",
  "none",
];

export function readCoachHome(data: unknown): CoachHome | null {
  if (!isRecord(data)) {
    return null;
  }

  const outgoing = readGrantList(data.outgoing);
  const athletes = readAthleteList(data.athletes);
  if (!outgoing || !athletes) {
    return null;
  }

  return { outgoing, athletes };
}

export function readCoachIssue(data: unknown): {
  url: string;
  text: string;
  grant: CoachGrantView;
} | null {
  if (!isRecord(data) || typeof data.url !== "string") {
    return null;
  }

  const url = data.url.trim();
  const grant = readGrant(data.grant);
  if (url === "" || !grant) {
    return null;
  }

  return {
    url,
    text: typeof data.text === "string" ? data.text : "",
    grant,
  };
}

export function readCoachClaim(data: unknown): { id: string } | null {
  if (!isRecord(data) || typeof data.id !== "string" || data.id === "") {
    return null;
  }

  return { id: data.id };
}

export function readCoachBoard(data: unknown): CoachBoard | null {
  if (!isRecord(data) || !isRecord(data.board)) {
    return null;
  }

  return readBoard(data.board);
}

function readGrantList(value: unknown): CoachGrantView[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const grants: CoachGrantView[] = [];
  for (const item of value) {
    const grant = readGrant(item);
    if (!grant) {
      return null;
    }
    grants.push(grant);
  }
  return grants;
}

function readGrant(value: unknown): CoachGrantView | null {
  if (!isRecord(value) || typeof value.id !== "string" || value.id === "") {
    return null;
  }
  if (typeof value.expires_at !== "string" || value.expires_at === "") {
    return null;
  }
  if (typeof value.claimed !== "boolean") {
    return null;
  }

  return {
    id: value.id,
    expires_at: value.expires_at,
    claimed: value.claimed,
    person: typeof value.person === "string" ? value.person : null,
  };
}

function readAthleteList(value: unknown): CoachAthleteView[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const athletes: CoachAthleteView[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || item.id === "") {
      return null;
    }
    if (
      typeof item.expires_at !== "string" ||
      typeof item.person !== "string"
    ) {
      return null;
    }
    if (item.person.trim() === "") {
      return null;
    }
    athletes.push({
      id: item.id,
      expires_at: item.expires_at,
      person: item.person,
    });
  }
  return athletes;
}

function readBoard(row: Record<string, unknown>): CoachBoard | null {
  if (typeof row.id !== "string" || row.id === "") {
    return null;
  }
  if (typeof row.athlete_name !== "string" || row.athlete_name.trim() === "") {
    return null;
  }
  if (typeof row.expires_at !== "string" || row.expires_at === "") {
    return null;
  }
  if (typeof row.today !== "string" || !isIsoDate(row.today)) {
    return null;
  }
  if (!Array.isArray(row.days)) {
    return null;
  }

  const days: CoachDay[] = [];
  for (const item of row.days) {
    const day = readDay(item);
    if (!day) {
      return null;
    }
    days.push(day);
  }

  return {
    id: row.id,
    athlete_name: row.athlete_name.trim(),
    expires_at: row.expires_at,
    today: row.today,
    weight: readWeight(row.weight),
    days,
  };
}

function readWeight(value: unknown): CoachBoard["weight"] {
  if (
    !isRecord(value) ||
    typeof value.date !== "string" ||
    !isIsoDate(value.date)
  ) {
    return null;
  }

  const kg = toNullableNumber(value.kg);
  if (kg == null || kg <= 0) {
    return null;
  }

  return { kg, date: value.date };
}

function readDay(value: unknown): CoachDay | null {
  if (
    !isRecord(value) ||
    typeof value.date !== "string" ||
    !isIsoDate(value.date)
  ) {
    return null;
  }

  const meals = readMeals(value.meals);
  const gym = readGym(value.gym);
  if (!meals || !gym) {
    return null;
  }

  return {
    date: value.date,
    training: value.training === true,
    caught_up: value.caught_up === true,
    target_protein: toNumber(value.target_protein),
    target_kcal: toNumber(value.target_kcal),
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
    body_weight: toNullableNumber(value.body_weight),
    protein_short: value.protein_short === true,
    meals,
    gym,
  };
}

function readMeals(value: unknown): CoachMeal[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const meals: CoachMeal[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.label !== "string") {
      return null;
    }
    const lines = readMealLines(item.items);
    if (!lines) {
      return null;
    }
    meals.push({ label: item.label, items: lines });
  }
  return meals;
}

function readMealLines(value: unknown): CoachMealLine[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const lines: CoachMealLine[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== "string" || item.name === "") {
      return null;
    }
    lines.push({
      name: item.name,
      grams: toNumber(item.grams),
      protein: toNumber(item.protein),
      kcal: toNumber(item.kcal),
    });
  }
  return lines;
}

function readGym(value: unknown): CoachGym | null {
  if (!isRecord(value) || !isGymTone(value.tone)) {
    return null;
  }
  if (typeof value.headline !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (!Array.isArray(value.lines)) {
    return null;
  }

  const lines: string[] = [];
  for (const line of value.lines) {
    if (typeof line !== "string") {
      return null;
    }
    lines.push(line);
  }

  return {
    tone: value.tone,
    title: value.title,
    headline: value.headline,
    lines,
  };
}

function isGymTone(value: unknown): value is CoachGymTone {
  return GYM_TONES.some((tone) => tone === value);
}
