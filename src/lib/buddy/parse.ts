import type {
  BuddyAthleteView,
  BuddyGrantView,
  BuddyGymState,
  BuddyHome,
  BuddyTodayBoard,
} from "@/lib/buddy/types";
import { isIsoDate } from "@/lib/day/dates";
import { isRecord } from "@/lib/read";

const GYM_STATES: readonly BuddyGymState[] = [
  "done",
  "open",
  "queued",
  "rest",
  "none",
];

function isBuddyGymState(value: string): value is BuddyGymState {
  return GYM_STATES.some((state) => state === value);
}

export function readBuddyHome(data: unknown): BuddyHome | null {
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

export function readBuddyIssue(data: unknown): {
  url: string;
  text: string;
  grant: BuddyGrantView;
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

export function readBuddyClaim(data: unknown): { id: string } | null {
  if (!isRecord(data) || typeof data.id !== "string" || data.id === "") {
    return null;
  }
  return { id: data.id };
}

export function readBuddyBoard(data: unknown): BuddyTodayBoard | null {
  if (!isRecord(data) || !isRecord(data.board)) {
    return null;
  }
  return readBoard(data.board);
}

function readGrantList(value: unknown): BuddyGrantView[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const grants: BuddyGrantView[] = [];
  for (const item of value) {
    const grant = readGrant(item);
    if (!grant) {
      return null;
    }
    grants.push(grant);
  }
  return grants;
}

function readGrant(value: unknown): BuddyGrantView | null {
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

function readAthleteList(value: unknown): BuddyAthleteView[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const athletes: BuddyAthleteView[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || item.id === "") {
      return null;
    }
    if (
      typeof item.expires_at !== "string" ||
      typeof item.person !== "string" ||
      item.person.trim() === ""
    ) {
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

function readBoard(row: Record<string, unknown>): BuddyTodayBoard | null {
  if (typeof row.id !== "string" || row.id === "") {
    return null;
  }
  if (typeof row.athlete_name !== "string" || row.athlete_name.trim() === "") {
    return null;
  }
  if (typeof row.expires_at !== "string" || row.expires_at === "") {
    return null;
  }
  if (typeof row.date !== "string" || !isIsoDate(row.date)) {
    return null;
  }
  if (typeof row.food_logged !== "boolean") {
    return null;
  }
  if (typeof row.protein_ok !== "boolean") {
    return null;
  }
  if (!isRecord(row.gym) || typeof row.gym.label !== "string") {
    return null;
  }
  const state = row.gym.state;
  if (typeof state !== "string" || !isBuddyGymState(state)) {
    return null;
  }
  return {
    id: row.id,
    athlete_name: row.athlete_name.trim(),
    expires_at: row.expires_at,
    date: row.date,
    food_logged: row.food_logged,
    protein_ok: row.protein_ok,
    gym: { state, label: row.gym.label },
  };
}
