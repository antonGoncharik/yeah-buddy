import type { SharePackSummary } from "@/lib/share/types";

export function isLiveOwnedPack(
  pack: Pick<SharePackSummary, "mine" | "revoked" | "received">,
): boolean {
  return pack.mine && !pack.revoked && !pack.received;
}
