import { APP_NAME } from "@/lib/brand";
import { loadOwnerName, loadPublicPack } from "@/lib/share/pack-load";
import { packShareText, type SharePackKind } from "@/lib/share/payload";
import { isPackToken } from "@/lib/share/token";

export function publicPackDescription(
  kind: SharePackKind,
  ownerName: string | null,
): string {
  const fromOwner = ownerName ? `От ${ownerName}. ` : "";
  return kind === "meals"
    ? `${fromOwner}Еда на день. Можно поставить себе.`
    : `${fromOwner}Очередь и схема весов. Можно поставить себе.`;
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
    return {
      title: packShareText(pack.kind, pack.title),
      description: publicPackDescription(pack.kind, ownerName),
    };
  } catch {
    return null;
  }
}

export function packOpenGraphFallbackTitle(): string {
  return `Ссылка — ${APP_NAME}`;
}
