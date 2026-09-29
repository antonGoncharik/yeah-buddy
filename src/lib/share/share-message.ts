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

export function readPreparedQuery(data: unknown): string | null {
  if (!isRecord(data) || typeof data.query !== "string") {
    return null;
  }
  const query = data.query.trim();
  return query === "" ? null : query;
}

export function readWeekSharePhotoUrl(data: unknown): string | null {
  if (!isRecord(data) || typeof data.photo_url !== "string") {
    return null;
  }
  const url = data.photo_url.trim();
  return url.startsWith("https://") ? url : null;
}

export type WeekSharePayload = {
  id: string | null;
  query: string;
  photoUrl: string;
  caption: string | null;
  installUrl: string | null;
};

export async function prepareWeekShare(): Promise<WeekSharePayload | null> {
  const data = await postJson("/api/share/week", {});
  const query = readPreparedQuery(data);
  const photoUrl = readWeekSharePhotoUrl(data);
  if (!query || !photoUrl) {
    return null;
  }

  const caption =
    isRecord(data) && typeof data.caption === "string"
      ? data.caption.trim()
      : null;
  const installUrl =
    isRecord(data) && typeof data.install_url === "string"
      ? data.install_url.trim()
      : null;

  return {
    id: readPreparedMessageId(data),
    query,
    photoUrl,
    caption: caption === "" ? null : caption,
    installUrl: installUrl === "" ? null : installUrl,
  };
}

export async function shareWeekToChat(
  cached?: WeekSharePayload | null,
): Promise<"shared" | "cancelled" | "failed"> {
  const payload = cached ?? (await prepareWeekShare());
  if (!payload) {
    return "failed";
  }

  const sent = await openPreparedShare(payload.id, payload.query);
  if (sent === "shared") {
    haptic("success");
  }
  return sent;
}

export async function shareWeekToStory(
  payload: WeekSharePayload,
): Promise<"opened" | "unavailable"> {
  const { sharePhotoToStory } = await import("@/lib/telegram/share-story");
  const { WEEK_CARD_BUTTON } = await import("@/lib/share/week-card");

  const params =
    payload.caption || payload.installUrl
      ? {
          text: payload.caption ?? undefined,
          widget_link: payload.installUrl
            ? { url: payload.installUrl, name: WEEK_CARD_BUTTON }
            : undefined,
        }
      : undefined;

  const result = await sharePhotoToStory(payload.photoUrl, params);
  if (result === "opened") {
    haptic("success");
  }
  return result;
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
    recordName: moment.recordName,
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

async function openPreparedShare(
  id: string | null,
  query: string,
): Promise<"shared" | "cancelled" | "failed"> {
  if (!id) {
    return switchInlineShare(query);
  }
  return sendPreparedMessage(id, query);
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
