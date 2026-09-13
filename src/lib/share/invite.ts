import { isRecord } from "@/lib/read";

export function readInvitePayload(
  data: unknown,
): { url: string; text: string } | null {
  if (!isRecord(data) || typeof data.url !== "string") {
    return null;
  }

  const url = data.url.trim();
  if (url === "") {
    return null;
  }

  return {
    url,
    text: typeof data.text === "string" ? data.text : "",
  };
}
