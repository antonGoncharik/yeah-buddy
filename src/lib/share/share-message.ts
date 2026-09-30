import { postJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";
import {
  type BarbellShareFacts,
  barbellInlineQuery,
} from "@/lib/share/barbell-daily";
import {
  BOT_INSTALL_DIARY,
  type JoyLift,
  type JoyMoment,
  joyShareRequest,
  SHARE_FAILED,
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

function readHttpsPhotoUrl(data: unknown): string | null {
  if (!isRecord(data) || typeof data.photo_url !== "string") {
    return null;
  }
  const url = data.photo_url.trim();
  return url.startsWith("https://") ? url : null;
}

function readShareCaption(data: unknown): string | null {
  if (!isRecord(data) || typeof data.caption !== "string") {
    return null;
  }
  const caption = data.caption.trim();
  return caption === "" ? null : caption;
}

function readInstallUrl(data: unknown): string | null {
  if (!isRecord(data) || typeof data.install_url !== "string") {
    return null;
  }
  const url = data.install_url.trim();
  return url === "" ? null : url;
}

export type PhotoSharePayload = {
  id: string | null;
  query: string;
  photoUrl: string;
  caption: string | null;
  installUrl: string | null;
};

function readPhotoSharePayload(data: unknown): PhotoSharePayload | null {
  const query = readPreparedQuery(data);
  const photoUrl = readHttpsPhotoUrl(data);
  if (!query || !photoUrl) {
    return null;
  }
  return {
    id: readPreparedMessageId(data),
    query,
    photoUrl,
    caption: readShareCaption(data),
    installUrl: readInstallUrl(data),
  };
}

export type WeekSharePayload = PhotoSharePayload;
export type JoySharePayload = PhotoSharePayload;
export type BarbellSharePayload = PhotoSharePayload;

export async function prepareWeekShare(): Promise<WeekSharePayload | null> {
  const data = await postJson("/api/share/week", {});
  return readPhotoSharePayload(data);
}

export async function prepareBarbellShare(
  facts: BarbellShareFacts,
): Promise<BarbellSharePayload | null> {
  const data = await postJson("/api/share/barbell", facts);
  return readPhotoSharePayload(data);
}

export async function shareBarbellToChat(
  facts: BarbellShareFacts,
  cached?: BarbellSharePayload | null,
): Promise<"shared" | "cancelled" | "failed"> {
  let payload = cached;
  if (!payload) {
    try {
      payload = await prepareBarbellShare(facts);
    } catch {
      payload = null;
    }
  }
  if (payload) {
    const sent = await openPreparedShare(payload.id, payload.query);
    if (sent !== "failed") {
      if (sent === "shared") {
        haptic("success");
      }
      return sent;
    }
  }

  const fallback = await switchInlineShare(barbellInlineQuery(facts));
  if (fallback === "shared") {
    haptic("success");
  }
  return fallback;
}

export async function shareBarbellToStory(
  payload: BarbellSharePayload,
): Promise<"opened" | "unavailable"> {
  return sharePayloadToStory(payload, "Собрать штангу");
}

export async function prepareJoyShare(
  moment: JoyMoment,
  lift: JoyLift | null,
): Promise<JoySharePayload | null> {
  const data = await postJson(
    "/api/share/prepared",
    joyShareRequest(moment, lift),
  );
  return readPhotoSharePayload(data);
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
  const { WEEK_CARD_BUTTON } = await import("@/lib/share/week-card");
  return sharePayloadToStory(payload, WEEK_CARD_BUTTON);
}

export async function shareJoyToChat(
  moment: JoyMoment,
  lift: JoyLift | null,
  cached?: JoySharePayload | null,
): Promise<"shared" | "cancelled" | "failed"> {
  let payload = cached;
  if (!payload) {
    try {
      payload = await prepareJoyShare(moment, lift);
    } catch {
      payload = null;
    }
  }
  if (payload) {
    const sent = await openPreparedShare(payload.id, payload.query);
    if (sent !== "failed") {
      if (sent === "shared") {
        haptic("success");
      }
      return sent;
    }
  }

  const { joyInlineQuery, sanitizeJoyLift } = await import("@/lib/share/joy");
  const safeLift = moment.allowKg ? sanitizeJoyLift(lift) : null;
  const fallback = await switchInlineShare(joyInlineQuery(moment, safeLift));
  if (fallback === "shared") {
    haptic("success");
  }
  return fallback;
}

export async function shareJoyToStory(
  payload: JoySharePayload,
): Promise<"opened" | "unavailable"> {
  return sharePayloadToStory(payload, BOT_INSTALL_DIARY);
}

async function sharePayloadToStory(
  payload: PhotoSharePayload,
  linkLabel: string,
): Promise<"opened" | "unavailable"> {
  const { sharePhotoToStory } = await import("@/lib/telegram/share-story");

  const params =
    payload.caption || payload.installUrl
      ? {
          text: payload.caption ?? undefined,
          widget_link: payload.installUrl
            ? { url: payload.installUrl, name: linkLabel }
            : undefined,
        }
      : undefined;

  const result = await sharePhotoToStory(payload.photoUrl, params);
  if (result === "opened") {
    haptic("success");
  }
  return result;
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
