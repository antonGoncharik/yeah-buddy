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
import { isTelegramAppWebViewLaunch } from "@/lib/telegram/launch-context";
import {
  loadTelegramWebApp,
  openTelegramShareUrl,
  telegramInlineShareAvailable,
} from "@/lib/telegram/webapp";

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
    const sent = await openPreparedShare(payload);
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

  const sent = await openPreparedShare(payload);
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
    const sent = await openPreparedShare(payload);
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
  payload: PhotoSharePayload,
): Promise<"shared" | "cancelled" | "failed"> {
  if (isTelegramAppWebViewLaunch()) {
    const link = await sharePhotoViaTelegramLink(payload);
    if (link !== "failed") {
      return link;
    }
    if (payload.id) {
      const prepared = await sendPreparedMessage(payload.id, payload);
      if (prepared !== "failed") {
        return prepared;
      }
    }
    return "failed";
  }

  if (payload.id) {
    const sent = await sendPreparedMessage(payload.id, payload);
    if (sent !== "failed") {
      return sent;
    }
  }

  if (telegramInlineShareAvailable()) {
    const inline = await switchInlineShare(payload.query);
    if (inline !== "failed") {
      return inline;
    }
  }

  return sharePhotoViaTelegramLink(payload);
}

async function sendPreparedMessage(
  id: string,
  payload: PhotoSharePayload,
): Promise<"shared" | "cancelled" | "failed"> {
  try {
    const webApp = await loadTelegramWebApp();
    const shareMessage = webApp.shareMessage;
    if (
      !webApp.isVersionAtLeast?.("8.0") ||
      typeof shareMessage !== "function"
    ) {
      return "failed";
    }

    return await new Promise((resolve) => {
      let settled = false;
      const finish = (value: "shared" | "cancelled" | "failed") => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };

      try {
        shareMessage(id, (sent) => {
          finish(sent ? "shared" : "cancelled");
        });
      } catch {
        finish("failed");
        return;
      }

      window.setTimeout(() => finish("failed"), 12_000);
    });
  } catch {
    return "failed";
  }
}

async function switchInlineShare(
  query: string,
): Promise<"shared" | "cancelled" | "failed"> {
  if (!telegramInlineShareAvailable()) {
    return "failed";
  }

  try {
    const webApp = await loadTelegramWebApp();
    if (typeof webApp.switchInlineQuery !== "function") {
      return "failed";
    }
    webApp.switchInlineQuery(query, ["users", "groups", "channels"]);
    return "shared";
  } catch {
    return "failed";
  }
}

async function sharePhotoViaTelegramLink(
  payload: PhotoSharePayload,
): Promise<"shared" | "cancelled" | "failed"> {
  const text = payload.caption?.trim() || payload.query;
  const opened = await openTelegramShareUrl(payload.photoUrl, text);
  return opened ? "shared" : "failed";
}

export function shareUnavailableMessage(): string {
  return SHARE_FAILED;
}
