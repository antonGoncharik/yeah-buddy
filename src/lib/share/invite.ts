import { isRecord } from "@/lib/read";

export const INVITE_HREF = "/workouts/invite";
export const SHOW_PROGRAM_LABEL = "Показать программу другу";
export const SHOW_PROGRAM_HINT = "QR на бот. Твоей еды и зала там нет.";

export function showProgramInvite(
  completedSessions: number,
  recentCompleted = 0,
): boolean {
  return completedSessions >= 1 || recentCompleted >= 1;
}

export function promptFirstProgramInvite(completedSessions: number): boolean {
  return completedSessions === 1;
}

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
