import {
  CoachLimitError,
  CoachNotFoundError,
  CoachOwnError,
  CoachShareError,
  CoachTakenError,
} from "@/lib/coach/errors";
import type {
  CoachAthleteView,
  CoachGrantView,
  CoachHome,
} from "@/lib/coach/types";
import { COACH_SHARE_TEXT } from "@/lib/messages";
import { createPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCoachShareUrl } from "@/lib/telegram/bot";

const GRANT_DAYS = 30;
const GRANT_LIMIT = 3;
const ATHLETE_FALLBACK = "Подопечный";

interface GrantRecord {
  id: string;
  athlete_user_id: string;
  token: string;
  coach_user_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  claimed_at: string | null;
}

export interface IssuedCoachLink {
  url: string;
  text: string;
  grant: CoachGrantView;
}

export async function loadCoachHome(userId: string): Promise<CoachHome> {
  const [outgoing, athletes] = await Promise.all([
    listOutgoing(userId),
    listAthletes(userId),
  ]);
  return { outgoing, athletes };
}

export async function issueCoachLink(userId: string): Promise<IssuedCoachLink> {
  const live = (await listAthleteGrants(userId)).filter(isLive);
  const open = live.find((row) => row.coach_user_id == null);
  if (open) {
    const extended = await extendGrant(open.id, userId);
    return present(extended);
  }

  if (live.length >= GRANT_LIMIT) {
    throw new CoachLimitError();
  }

  const created = await insertGrant(userId);
  return present(created);
}

export async function renewCoachGrant(
  userId: string,
  grantId: string,
): Promise<CoachGrantView> {
  const row = await loadAthleteGrant(userId, grantId);
  if (!row || !isLive(row)) {
    throw new CoachNotFoundError();
  }

  const extended = await extendGrant(row.id, userId);
  const names = await personNames([extended.coach_user_id]);
  return toGrantView(extended, names);
}

export async function revokeCoachGrant(
  userId: string,
  grantId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grantId)
    .eq("athlete_user_id", userId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }
  if (!result.data) {
    throw new CoachNotFoundError();
  }
}

export async function claimCoachGrant(
  coachUserId: string,
  token: string,
): Promise<{ id: string }> {
  const row = await loadByToken(token);
  if (!row || !isLive(row)) {
    throw new CoachNotFoundError();
  }
  if (row.athlete_user_id === coachUserId) {
    throw new CoachOwnError();
  }
  if (row.coach_user_id === coachUserId) {
    return { id: row.id };
  }
  if (row.coach_user_id) {
    throw new CoachTakenError();
  }

  const supabase = createSupabaseServerClient();
  const claimed = await supabase
    .from("coach_grants")
    .update({
      coach_user_id: coachUserId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .is("coach_user_id", null)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (claimed.error) {
    throw claimed.error;
  }
  if (claimed.data) {
    return { id: row.id };
  }

  const again = await loadByToken(token);
  if (again?.coach_user_id === coachUserId && isLive(again)) {
    return { id: again.id };
  }
  throw new CoachTakenError();
}

export async function requireBoardGrant(
  userId: string,
  grantId: string,
): Promise<GrantRecord> {
  const row = await loadById(grantId);
  if (!row || !isLive(row)) {
    throw new CoachNotFoundError();
  }
  if (row.athlete_user_id !== userId && row.coach_user_id !== userId) {
    throw new CoachNotFoundError();
  }
  return row;
}

async function present(row: GrantRecord): Promise<IssuedCoachLink> {
  const url = await getCoachShareUrl(row.token);
  if (!url) {
    throw new CoachShareError();
  }

  const names = await personNames([row.coach_user_id]);
  return {
    url,
    text: COACH_SHARE_TEXT,
    grant: toGrantView(row, names),
  };
}

async function listOutgoing(userId: string): Promise<CoachGrantView[]> {
  const live = (await listAthleteGrants(userId)).filter(isLive);
  const names = await personNames(live.map((row) => row.coach_user_id));
  return live.map((row) => toGrantView(row, names));
}

async function listAthletes(coachUserId: string): Promise<CoachAthleteView[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .eq("coach_user_id", coachUserId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) {
    throw result.error;
  }

  const live = (result.data ?? [])
    .map((row) => mapGrant(row as Record<string, unknown>))
    .filter((row): row is GrantRecord => row != null && isLive(row));
  const names = await personNames(live.map((row) => row.athlete_user_id));

  return live.map((row) => ({
    id: row.id,
    expires_at: row.expires_at,
    person: names.get(row.athlete_user_id) || ATHLETE_FALLBACK,
  }));
}

async function listAthleteGrants(userId: string): Promise<GrantRecord[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .eq("athlete_user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? [])
    .map((row) => mapGrant(row as Record<string, unknown>))
    .filter((row): row is GrantRecord => row != null);
}

async function insertGrant(userId: string): Promise<GrantRecord> {
  const supabase = createSupabaseServerClient();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = createPackToken();
    const url = await getCoachShareUrl(token);
    if (!url) {
      throw new CoachShareError();
    }

    const inserted = await supabase
      .from("coach_grants")
      .insert({
        athlete_user_id: userId,
        token,
        expires_at: expiresFromNow(),
      })
      .select(
        "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
      )
      .single();

    if (!inserted.error && inserted.data) {
      const row = mapGrant(inserted.data as Record<string, unknown>);
      if (row) {
        return row;
      }
    }

    lastError = inserted.error;
    if (inserted.error && inserted.error.code !== "23505") {
      throw inserted.error;
    }
  }

  throw lastError instanceof Error ? lastError : new CoachShareError();
}

async function extendGrant(
  grantId: string,
  userId: string,
): Promise<GrantRecord> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .update({ expires_at: expiresFromNow() })
    .eq("id", grantId)
    .eq("athlete_user_id", userId)
    .is("revoked_at", null)
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  const row = result.data
    ? mapGrant(result.data as Record<string, unknown>)
    : null;
  if (!row) {
    throw new CoachNotFoundError();
  }
  return row;
}

async function loadAthleteGrant(
  userId: string,
  grantId: string,
): Promise<GrantRecord | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .eq("id", grantId)
    .eq("athlete_user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapGrant(result.data as Record<string, unknown>) : null;
}

async function loadByToken(token: string): Promise<GrantRecord | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .eq("token", token)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapGrant(result.data as Record<string, unknown>) : null;
}

async function loadById(grantId: string): Promise<GrantRecord | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("coach_grants")
    .select(
      "id, athlete_user_id, token, coach_user_id, expires_at, revoked_at, claimed_at",
    )
    .eq("id", grantId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapGrant(result.data as Record<string, unknown>) : null;
}

async function personNames(
  ids: Array<string | null>,
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (unique.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("users")
    .select("id, first_name, username")
    .in("id", unique);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    if (typeof row.id !== "string") {
      continue;
    }
    const label = personLabel(row.first_name, row.username);
    if (label) {
      names.set(row.id, label);
    }
  }

  return names;
}

function toGrantView(
  row: GrantRecord,
  names: Map<string, string>,
): CoachGrantView {
  const person = row.coach_user_id
    ? names.get(row.coach_user_id) || "Тренер"
    : null;
  return {
    id: row.id,
    expires_at: row.expires_at,
    claimed: row.coach_user_id != null,
    person,
  };
}

function personLabel(firstName: unknown, username: unknown): string {
  if (typeof firstName === "string" && firstName.trim() !== "") {
    return firstName.trim();
  }
  if (typeof username === "string" && username.trim() !== "") {
    return `@${username.trim()}`;
  }
  return "";
}

function mapGrant(row: Record<string, unknown>): GrantRecord | null {
  if (typeof row.id !== "string" || typeof row.athlete_user_id !== "string") {
    return null;
  }
  if (typeof row.token !== "string" || typeof row.expires_at !== "string") {
    return null;
  }

  return {
    id: row.id,
    athlete_user_id: row.athlete_user_id,
    token: row.token,
    coach_user_id:
      typeof row.coach_user_id === "string" ? row.coach_user_id : null,
    expires_at: row.expires_at,
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    claimed_at: typeof row.claimed_at === "string" ? row.claimed_at : null,
  };
}

function isLive(row: GrantRecord, now = Date.now()): boolean {
  return row.revoked_at == null && Date.parse(row.expires_at) > now;
}

function expiresFromNow(): string {
  return new Date(Date.now() + GRANT_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
