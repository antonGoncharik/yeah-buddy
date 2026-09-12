import { toPlateRow } from "@/components/day/plate-draft";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { ApiError } from "@/lib/api-cache";
import { AI_PLATE_FAILED, readApiError } from "@/lib/messages";

export async function requestPlateDraft(blob: Blob, signal?: AbortSignal) {
  const body = new FormData();
  body.append("image", blob, "plate.jpg");
  const response = await fetch("/api/ai/plate", {
    method: "POST",
    body,
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readApiError(data) ?? AI_PLATE_FAILED,
      response.status,
      data,
    );
  }

  const parsed = parsePlateDraft(data);
  if (!parsed) {
    throw new Error(AI_PLATE_FAILED);
  }

  return parsed.items.map(toPlateRow);
}
