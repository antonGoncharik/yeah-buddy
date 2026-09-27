import { toPlateRow } from "@/components/day/plate-draft";
import { parseRemaining } from "@/lib/ai/parse-review";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { ApiError } from "@/lib/api-cache";
import { AI_DICTATE_FAILED, readApiError } from "@/lib/messages";
import { isRecord } from "@/lib/read";

export async function requestDictateDraft(blob: Blob, signal?: AbortSignal) {
  const body = new FormData();
  body.append("audio", blob, "speech.wav");
  const response = await fetch("/api/ai/dictate", {
    method: "POST",
    body,
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readApiError(data) ?? AI_DICTATE_FAILED,
      response.status,
      data,
    );
  }

  const parsed = parsePlateDraft(data);
  if (!parsed) {
    throw new Error(AI_DICTATE_FAILED);
  }

  return {
    items: parsed.items.map(toPlateRow),
    remaining: parseRemaining(isRecord(data) ? data.remaining : null),
  };
}
