import { toPlateRow } from "@/components/day/plate-draft";
import { parseRemaining } from "@/lib/ai/parse-review";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { ApiError } from "@/lib/api-cache";
import { AI_TEXT_MEAL_FAILED, readApiError } from "@/lib/messages";
import { isRecord } from "@/lib/read";

export async function requestTextMealDraft(text: string, signal?: AbortSignal) {
  const response = await fetch("/api/ai/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readApiError(data) ?? AI_TEXT_MEAL_FAILED,
      response.status,
      data,
    );
  }

  const parsed = parsePlateDraft(data);
  if (!parsed) {
    throw new Error(AI_TEXT_MEAL_FAILED);
  }

  return {
    items: parsed.items.map(toPlateRow),
    remaining: parseRemaining(isRecord(data) ? data.remaining : null),
  };
}
