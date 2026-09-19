import { APP_NAME } from "@/lib/brand";
import { loadOwnerName, loadPublicPack } from "@/lib/share/pack-load";
import { packChatMessage, packPoster } from "@/lib/share/payload";
import { isPackToken } from "@/lib/share/token";

export function publicPackDescription(
  ownerName: string | null,
  poster: string,
): string {
  const fromOwner = ownerName ? `От ${ownerName}. ` : "";
  return `${fromOwner}${poster}`;
}

export async function publicPackOpenGraph(
  token: string,
): Promise<{ title: string; description: string } | null> {
  if (!isPackToken(token)) {
    return null;
  }

  try {
    const pack = await loadPublicPack(token);
    if (!pack || pack.revoked_at) {
      return null;
    }

    const ownerName = await loadOwnerName(pack.owner_user_id);
    const poster = packPoster(pack.kind, pack.payload);
    return {
      title: poster,
      description: ownerName ? `От ${ownerName}` : APP_NAME,
    };
  } catch {
    return null;
  }
}

export async function packBotReply(
  token: string,
): Promise<{ text: string } | null> {
  if (!isPackToken(token)) {
    return null;
  }

  try {
    const pack = await loadPublicPack(token);
    if (!pack || pack.revoked_at) {
      return null;
    }

    const ownerName = await loadOwnerName(pack.owner_user_id);
    return {
      text: packChatMessage(ownerName, packPoster(pack.kind, pack.payload)),
    };
  } catch {
    return null;
  }
}

export function packOpenGraphFallbackTitle(): string {
  return `Ссылка — ${APP_NAME}`;
}
