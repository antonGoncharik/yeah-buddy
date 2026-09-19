import { postJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import {
  type JoyLift,
  type JoyMoment,
  type JoyShareRequest,
  joyInlineQuery,
  SHARE_FAILED,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import { haptic } from "@/lib/telegram/haptic";

export function readPreparedMessageId(data: unknown): string | null {
  if (!isRecord(data) || typeof data.id !== "string") {
    return null;
  }
  const id = data.id.trim();
  return id === "" ? null : id;
}

export async function shareJoyToChat(
  moment: JoyMoment,
  lift: JoyLift | null,
): Promise<"shared" | "cancelled" | "failed"> {
  const safeLift = moment.allowKg ? sanitizeJoyLift(lift) : null;
  const request: JoyShareRequest = {
    kind: moment.kind,
    feel: moment.feel ?? null,
    sessions: moment.sessions,
    proteinHits: moment.proteinHits,
    lift: safeLift,
  };
  const query = joyInlineQuery(moment, safeLift);

  try {
    const data = await postJson("/api/share/prepared", request);
    const id = readPreparedMessageId(data);
    if (id) {
      const sent = await sendPreparedMessage(id, query);
      if (sent !== "failed") {
        if (sent === "shared") {
          haptic("success");
        }
        return sent;
      }
    }
  } catch {
    // prepared inline needs Bot API 8 and inline mode; fall back below
  }

  const fallback = await switchInlineShare(query);
  if (fallback === "shared") {
    haptic("success");
  }
  return fallback;
}

async function sendPreparedMessage(
  id: string,
  query: string,
): Promise<"shared" | "cancelled" | "failed"> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default;
    if (
      !webApp.isVersionAtLeast("8.0") ||
      typeof webApp.shareMessage !== "function"
    ) {
      return switchInlineShare(query);
    }

    return await new Promise((resolve) => {
      try {
        webApp.shareMessage(id, (sent) => {
          resolve(sent ? "shared" : "cancelled");
        });
      } catch {
        void switchInlineShare(query).then(resolve);
      }
    });
  } catch {
    return "failed";
  }
}

async function switchInlineShare(
  query: string,
): Promise<"shared" | "cancelled" | "failed"> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default;
    if (typeof webApp.switchInlineQuery !== "function") {
      return "failed";
    }
    webApp.switchInlineQuery(query, ["users", "groups", "channels"]);
    return "shared";
  } catch {
    return "failed";
  }
}

export function shareUnavailableMessage(): string {
  return SHARE_FAILED;
}
