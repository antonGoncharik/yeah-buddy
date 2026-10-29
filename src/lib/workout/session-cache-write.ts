import { peekJson, writeJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import type { SessionDetail } from "@/lib/types";
import { sessionDateUrl, sessionDetailUrl } from "@/lib/workout/session-urls";

export function writeSessionDetailCache(
  sessionId: string,
  detail: SessionDetail,
): void {
  writeJson(sessionDetailUrl(sessionId), detail);
}

export function writeCompletedSessionCaches(
  sessionId: string,
  detail: SessionDetail,
): void {
  writeSessionDetailCache(sessionId, detail);
  const hubUrl = sessionDateUrl(detail.session.session_date);
  const current = peekJson(hubUrl);
  writeJson(
    hubUrl,
    isRecord(current)
      ? { ...current, session: detail.session }
      : { session: detail.session },
  );
}
