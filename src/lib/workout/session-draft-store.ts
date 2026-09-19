import { isRecord } from "@/lib/read";

export type StoredSetDraft = {
  weight: string;
  reps: string;
  seconds: string;
  rir: string;
};

export interface StoredSessionDraft {
  drafts: Record<string, StoredSetDraft>;
  note: string;
}

const PREFIX = "yb.v1:session-draft:";
const memory = new Map<string, StoredSessionDraft>();

export function sessionDraftKey(sessionId: string): string {
  return `${PREFIX}${sessionId}`;
}

export function rewriteSessionDraftIds(
  fromSessionId: string,
  toSessionId: string,
  ids: Map<string, string>,
): void {
  const stored = readSessionDraft(fromSessionId);
  if (!stored) {
    return;
  }

  const drafts: Record<string, StoredSetDraft> = {};
  for (const [id, draft] of Object.entries(stored.drafts)) {
    drafts[ids.get(id) ?? id] = draft;
  }
  writeSessionDraft(toSessionId, { ...stored, drafts });
  if (fromSessionId !== toSessionId) {
    clearSessionDraft(fromSessionId);
  }
}

export function overlaySessionDrafts(
  base: Record<string, StoredSetDraft>,
  stored: Record<string, StoredSetDraft> | null | undefined,
): Record<string, StoredSetDraft> {
  if (!stored) {
    return base;
  }

  const next = { ...base };
  for (const id of Object.keys(base)) {
    const draft = stored[id];
    if (draft) {
      next[id] = draft;
    }
  }
  return next;
}

export function readSessionDraft(sessionId: string): StoredSessionDraft | null {
  const cached = memory.get(sessionId);
  if (cached) {
    return cached;
  }
  return parseDraft(storage()?.getItem(sessionDraftKey(sessionId)) ?? null);
}

export function writeSessionDraft(
  sessionId: string,
  draft: StoredSessionDraft,
): void {
  memory.set(sessionId, draft);
  try {
    storage()?.setItem(sessionDraftKey(sessionId), JSON.stringify(draft));
  } catch {
    // quota, private mode, or disabled storage
  }
}

export function clearSessionDraft(sessionId: string): void {
  memory.delete(sessionId);
  try {
    storage()?.removeItem(sessionDraftKey(sessionId));
  } catch {
    // private mode, or disabled storage
  }
}

export function clearSessionDrafts(): void {
  memory.clear();
}

function parseDraft(raw: string | null): StoredSessionDraft | null {
  if (raw == null || raw === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.drafts)) {
      return null;
    }

    const drafts: Record<string, StoredSetDraft> = {};
    for (const [id, value] of Object.entries(parsed.drafts)) {
      const draft = parseSetDraft(value);
      if (draft) {
        drafts[id] = draft;
      }
    }

    return {
      drafts,
      note:
        "note" in parsed && typeof parsed.note === "string" ? parsed.note : "",
    };
  } catch {
    return null;
  }
}

function parseSetDraft(value: unknown): StoredSetDraft | null {
  if (!isRecord(value)) {
    return null;
  }
  const row = value;
  if (
    typeof row.weight !== "string" ||
    typeof row.reps !== "string" ||
    typeof row.seconds !== "string" ||
    typeof row.rir !== "string"
  ) {
    return null;
  }
  return {
    weight: row.weight,
    reps: row.reps,
    seconds: row.seconds,
    rir: row.rir,
  };
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}
