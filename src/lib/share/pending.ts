import { buddyStartPayload, parseBuddyStartPayload } from "@/lib/buddy/start";
import { coachStartPayload, parseCoachStartPayload } from "@/lib/coach/start";
import { BARBELL_GAME_HREF } from "@/lib/share/barbell-daily";
import { parseBarbellStartPayload } from "@/lib/share/barbell-start";
import {
  isPublicProgramId,
  type PublicProgramId,
} from "@/lib/share/program-public";
import { parseProgramStartPayload } from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";

const PACK_PENDING_KEY = "yb.pack";
const PACK_SEEN_KEY = "yb.pack.seen";
const PROGRAM_PENDING_KEY = "yb.program";
const PROGRAM_SEEN_KEY = "yb.program.seen";
const COACH_PENDING_KEY = "yb.coach";
const COACH_SEEN_KEY = "yb.coach.seen";
const BUDDY_PENDING_KEY = "yb.buddy";
const BUDDY_SEEN_KEY = "yb.buddy.seen";
const BARBELL_PENDING_KEY = "yb.barbell";
const BARBELL_SEEN_KEY = "yb.barbell.seen";

export type PackBackFrom = "meals" | "schedule" | "packs" | "today";

function storage(): Storage | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage;
}

export function rememberIncomingStart(value: string | null | undefined): void {
  if (!value) {
    return;
  }

  if (parseBarbellStartPayload(value)) {
    rememberBarbellStart();
    return;
  }

  const programId = parseProgramStartPayload(value);
  if (programId) {
    rememberProgramStart(programId);
    return;
  }

  const coachToken = parseCoachStartPayload(value);
  if (coachToken) {
    rememberCoachToken(coachToken);
    return;
  }

  const buddyToken = parseBuddyStartPayload(value);
  if (buddyToken) {
    rememberBuddyToken(buddyToken);
    return;
  }

  rememberPackToken(value);
}

export function rememberProgramStart(id: PublicProgramId): void {
  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PROGRAM_SEEN_KEY) === id) {
    return;
  }

  store.setItem(PROGRAM_PENDING_KEY, id);
}

export function peekPendingProgramId(): PublicProgramId | null {
  const value = storage()?.getItem(PROGRAM_PENDING_KEY);
  return isPublicProgramId(value) ? value : null;
}

export function dismissPendingProgramId(id: PublicProgramId): void {
  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PROGRAM_PENDING_KEY) === id) {
    store.removeItem(PROGRAM_PENDING_KEY);
  }
  store.setItem(PROGRAM_SEEN_KEY, id);
}

export function rememberCoachToken(token: string | null | undefined): void {
  if (!token || parseCoachStartPayload(coachStartPayload(token)) == null) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(COACH_SEEN_KEY) === token) {
    return;
  }

  store.setItem(COACH_PENDING_KEY, token);
}

export function peekPendingCoachToken(): string | null {
  const token = storage()?.getItem(COACH_PENDING_KEY) ?? null;
  if (!token || parseCoachStartPayload(coachStartPayload(token)) == null) {
    return null;
  }
  return token;
}

export function rememberBuddyToken(token: string | null | undefined): void {
  if (!token || parseBuddyStartPayload(buddyStartPayload(token)) == null) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(BUDDY_SEEN_KEY) === token) {
    return;
  }

  store.setItem(BUDDY_PENDING_KEY, token);
}

export function peekPendingBuddyToken(): string | null {
  const token = storage()?.getItem(BUDDY_PENDING_KEY) ?? null;
  if (!token || parseBuddyStartPayload(buddyStartPayload(token)) == null) {
    return null;
  }
  return token;
}

export function dismissPendingBuddyToken(token: string): void {
  if (parseBuddyStartPayload(buddyStartPayload(token)) == null) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(BUDDY_PENDING_KEY) === token) {
    store.removeItem(BUDDY_PENDING_KEY);
  }
  store.setItem(BUDDY_SEEN_KEY, token);
}

export function dismissPendingCoachToken(token: string): void {
  if (parseCoachStartPayload(coachStartPayload(token)) == null) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(COACH_PENDING_KEY) === token) {
    store.removeItem(COACH_PENDING_KEY);
  }
  store.setItem(COACH_SEEN_KEY, token);
}

export function rememberBarbellStart(): void {
  const store = storage();
  if (!store) {
    return;
  }
  if (store.getItem(BARBELL_SEEN_KEY) === "1") {
    return;
  }
  store.setItem(BARBELL_PENDING_KEY, "1");
}

export function peekPendingBarbell(): boolean {
  return storage()?.getItem(BARBELL_PENDING_KEY) === "1";
}

export function dismissPendingBarbell(): void {
  const store = storage();
  if (!store) {
    return;
  }
  if (store.getItem(BARBELL_PENDING_KEY) === "1") {
    store.removeItem(BARBELL_PENDING_KEY);
  }
  store.setItem(BARBELL_SEEN_KEY, "1");
}

export function barbellPath(): string {
  return BARBELL_GAME_HREF;
}

export function rememberPackToken(token: string | null | undefined): void {
  if (
    !token ||
    parseProgramStartPayload(token) ||
    parseCoachStartPayload(token) ||
    parseBuddyStartPayload(token) ||
    parseBarbellStartPayload(token) ||
    !isPackToken(token)
  ) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PACK_SEEN_KEY) === token) {
    return;
  }

  store.setItem(PACK_PENDING_KEY, token);
}

export function peekPendingPackToken(): string | null {
  return storage()?.getItem(PACK_PENDING_KEY) ?? null;
}

export function takePendingPackToken(): string | null {
  const store = storage();
  if (!store) {
    return null;
  }

  const token = store.getItem(PACK_PENDING_KEY);
  if (!token) {
    return null;
  }

  store.removeItem(PACK_PENDING_KEY);
  store.setItem(PACK_SEEN_KEY, token);
  return token;
}

export function dismissPendingPackToken(token: string): void {
  if (!isPackToken(token)) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PACK_PENDING_KEY) === token) {
    store.removeItem(PACK_PENDING_KEY);
  }
  store.setItem(PACK_SEEN_KEY, token);
}

export function packPath(token: string, from?: PackBackFrom): string {
  const path = `/packs/${token}`;
  if (!from) {
    return path;
  }
  return `${path}?from=${from}`;
}

export function parsePackBackFrom(value: string | null): PackBackFrom | null {
  if (
    value === "meals" ||
    value === "schedule" ||
    value === "packs" ||
    value === "today"
  ) {
    return value;
  }
  return null;
}

export function packBackHref(from: PackBackFrom | null): string {
  if (from === "meals") {
    return "/settings/meals";
  }
  if (from === "schedule") {
    return "/workouts/schedule";
  }
  if (from === "today") {
    return "/today";
  }
  return "/settings/packs";
}
