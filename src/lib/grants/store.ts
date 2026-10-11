import { grantExpiresAt, isGrantLive, personLabel } from "@/lib/grants/record";
import { createPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GRANT_LIMIT = 3;

export interface GrantRow {
  id: string;
  athlete_user_id: string;
  token: string;
  claimant_user_id: string | null;
  expires_at: string;
  revoked_at: string | null;
  claimed_at: string | null;
}

export interface GrantView {
  id: string;
  expires_at: string;
  claimed: boolean;
  person: string | null;
}

export interface GrantAthleteView {
  id: string;
  expires_at: string;
  person: string;
}

export interface GrantHome {
  outgoing: GrantView[];
  athletes: GrantAthleteView[];
}

export interface IssuedGrantLink {
  url: string;
  text: string;
  grant: GrantView;
}

interface GrantErrorCtor {
  new (): Error;
}

export interface GrantStoreConfig {
  table: "buddy_grants" | "coach_grants";
  claimantColumn: "buddy_user_id" | "coach_user_id";
  shareText: string;
  claimedFallback: string;
  athleteFallback: string;
  shareUrl: (token: string) => Promise<string | null>;
  boardAccess: "claimant" | "athlete-or-claimant";
  errors: {
    notFound: GrantErrorCtor;
    taken: GrantErrorCtor;
    own: GrantErrorCtor;
    limit: GrantErrorCtor;
    share: GrantErrorCtor;
  };
}

export function createGrantStore(config: GrantStoreConfig) {
  const columns = `id, athlete_user_id, token, ${config.claimantColumn}, expires_at, revoked_at, claimed_at`;

  return {
    loadHome,
    issueLink,
    renewGrant,
    revokeGrant,
    claimGrant,
    requireBoard,
  };

  async function loadHome(userId: string): Promise<GrantHome> {
    const [outgoing, athletes] = await Promise.all([
      listOutgoing(userId),
      listAthletes(userId),
    ]);
    return { outgoing, athletes };
  }

  async function issueLink(userId: string): Promise<IssuedGrantLink> {
    const live = (await listAthleteGrants(userId)).filter((row) =>
      isGrantLive(row),
    );
    const open = live.find((row) => row.claimant_user_id == null);
    if (open) {
      const extended = await extendGrant(open.id, userId);
      return present(extended);
    }

    if (live.length >= GRANT_LIMIT) {
      throw new config.errors.limit();
    }

    const created = await insertGrant(userId);
    return present(created);
  }

  async function renewGrant(
    userId: string,
    grantId: string,
  ): Promise<GrantView> {
    const row = await loadAthleteGrant(userId, grantId);
    if (!row || !isGrantLive(row)) {
      throw new config.errors.notFound();
    }

    const extended = await extendGrant(row.id, userId);
    const names = await personNames([extended.claimant_user_id]);
    return toGrantView(extended, names);
  }

  async function revokeGrant(userId: string, grantId: string): Promise<void> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
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
      throw new config.errors.notFound();
    }
  }

  async function claimGrant(
    claimantUserId: string,
    token: string,
  ): Promise<{ id: string }> {
    const row = await loadByToken(token);
    if (!row || !isGrantLive(row)) {
      throw new config.errors.notFound();
    }
    if (row.athlete_user_id === claimantUserId) {
      throw new config.errors.own();
    }
    if (row.claimant_user_id === claimantUserId) {
      return { id: row.id };
    }
    if (row.claimant_user_id) {
      throw new config.errors.taken();
    }

    const supabase = createSupabaseServerClient();
    const claimed = await supabase
      .from(config.table)
      .update({
        [config.claimantColumn]: claimantUserId,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .is(config.claimantColumn, null)
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
    if (again?.claimant_user_id === claimantUserId && isGrantLive(again)) {
      return { id: again.id };
    }
    throw new config.errors.taken();
  }

  async function requireBoard(
    userId: string,
    grantId: string,
  ): Promise<GrantRow> {
    const row = await loadById(grantId);
    if (!row || !isGrantLive(row) || !canSeeBoard(row, userId)) {
      throw new config.errors.notFound();
    }
    return row;
  }

  function canSeeBoard(row: GrantRow, userId: string): boolean {
    if (config.boardAccess === "claimant") {
      return row.claimant_user_id === userId;
    }
    return row.athlete_user_id === userId || row.claimant_user_id === userId;
  }

  async function present(row: GrantRow): Promise<IssuedGrantLink> {
    const url = await config.shareUrl(row.token);
    if (!url) {
      throw new config.errors.share();
    }

    const names = await personNames([row.claimant_user_id]);
    return {
      url,
      text: config.shareText,
      grant: toGrantView(row, names),
    };
  }

  async function listOutgoing(userId: string): Promise<GrantView[]> {
    const live = (await listAthleteGrants(userId)).filter((row) =>
      isGrantLive(row),
    );
    const names = await personNames(live.map((row) => row.claimant_user_id));
    return live.map((row) => toGrantView(row, names));
  }

  async function listAthletes(
    claimantUserId: string,
  ): Promise<GrantAthleteView[]> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .select(columns)
      .eq(config.claimantColumn, claimantUserId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (result.error) {
      throw result.error;
    }

    const live = rowsFrom(result.data).filter((row) => isGrantLive(row));
    const names = await personNames(live.map((row) => row.athlete_user_id));

    return live.map((row) => ({
      id: row.id,
      expires_at: row.expires_at,
      person: names.get(row.athlete_user_id) || config.athleteFallback,
    }));
  }

  async function listAthleteGrants(userId: string): Promise<GrantRow[]> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .select(columns)
      .eq("athlete_user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (result.error) {
      throw result.error;
    }

    return rowsFrom(result.data);
  }

  async function insertGrant(userId: string): Promise<GrantRow> {
    const supabase = createSupabaseServerClient();
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = createPackToken();
      const url = await config.shareUrl(token);
      if (!url) {
        throw new config.errors.share();
      }

      const inserted = await supabase
        .from(config.table)
        .insert({
          athlete_user_id: userId,
          token,
          expires_at: grantExpiresAt(),
        })
        .select(columns)
        .single();

      if (!inserted.error) {
        const row = rowFrom(inserted.data);
        if (row) {
          return row;
        }
      }

      lastError = inserted.error;
      if (inserted.error && inserted.error.code !== "23505") {
        throw inserted.error;
      }
    }

    throw lastError instanceof Error ? lastError : new config.errors.share();
  }

  async function extendGrant(
    grantId: string,
    userId: string,
  ): Promise<GrantRow> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .update({ expires_at: grantExpiresAt() })
      .eq("id", grantId)
      .eq("athlete_user_id", userId)
      .is("revoked_at", null)
      .select(columns)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    const row = rowFrom(result.data);
    if (!row) {
      throw new config.errors.notFound();
    }
    return row;
  }

  async function loadAthleteGrant(
    userId: string,
    grantId: string,
  ): Promise<GrantRow | null> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .select(columns)
      .eq("id", grantId)
      .eq("athlete_user_id", userId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return rowFrom(result.data);
  }

  async function loadByToken(token: string): Promise<GrantRow | null> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .select(columns)
      .eq("token", token)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return rowFrom(result.data);
  }

  async function loadById(grantId: string): Promise<GrantRow | null> {
    const supabase = createSupabaseServerClient();
    const result = await supabase
      .from(config.table)
      .select(columns)
      .eq("id", grantId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return rowFrom(result.data);
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

  function toGrantView(row: GrantRow, names: Map<string, string>): GrantView {
    const person = row.claimant_user_id
      ? names.get(row.claimant_user_id) || config.claimedFallback
      : null;
    return {
      id: row.id,
      expires_at: row.expires_at,
      claimed: row.claimant_user_id != null,
      person,
    };
  }

  function isRow(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function rowFrom(data: unknown): GrantRow | null {
    return isRow(data) ? mapGrant(data) : null;
  }

  function rowsFrom(data: unknown): GrantRow[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data.flatMap((item) => {
      const row = rowFrom(item);
      return row ? [row] : [];
    });
  }

  function mapGrant(row: Record<string, unknown>): GrantRow | null {
    if (typeof row.id !== "string" || typeof row.athlete_user_id !== "string") {
      return null;
    }
    if (typeof row.token !== "string" || typeof row.expires_at !== "string") {
      return null;
    }

    const claimant = row[config.claimantColumn];
    return {
      id: row.id,
      athlete_user_id: row.athlete_user_id,
      token: row.token,
      claimant_user_id: typeof claimant === "string" ? claimant : null,
      expires_at: row.expires_at,
      revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
      claimed_at: typeof row.claimed_at === "string" ? row.claimed_at : null,
    };
  }
}
