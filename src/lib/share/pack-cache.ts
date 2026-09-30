import { peekJson, writeJson } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";

export function removePackFromListCache(token: string): void {
  const cached = peekJson("/api/packs");
  if (!isRecord(cached) || !Array.isArray(cached.packs)) {
    return;
  }

  writeJson("/api/packs", {
    packs: cached.packs.filter(
      (row) => !(isRecord(row) && row.token === token),
    ),
  });
}
