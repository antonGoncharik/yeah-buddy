import {
  GUIDE_TIP_IDS,
  type GuideSeen,
  type GuideTipId,
} from "@/lib/guide/types";
import { isRecord } from "@/lib/read";

export const GUIDE_SEEN_KEY = "yb.guide.seen";

export function emptyGuideSeen(): GuideSeen {
  return { dismissed: [] };
}

export function parseGuideSeen(raw: unknown): GuideSeen {
  if (typeof raw === "string") {
    try {
      return parseGuideSeen(JSON.parse(raw));
    } catch {
      return emptyGuideSeen();
    }
  }

  if (!isRecord(raw) || !Array.isArray(raw.dismissed)) {
    return emptyGuideSeen();
  }

  const dismissed: GuideTipId[] = [];
  for (const item of raw.dismissed) {
    if (!isGuideTipId(item) || dismissed.includes(item)) {
      continue;
    }
    dismissed.push(item);
  }
  return { dismissed };
}

export function isGuideTipId(value: unknown): value is GuideTipId {
  return (
    typeof value === "string" &&
    (GUIDE_TIP_IDS as readonly string[]).includes(value)
  );
}

export function isTipDismissed(seen: GuideSeen, id: GuideTipId): boolean {
  return seen.dismissed.includes(id);
}

export function withDismissedTip(seen: GuideSeen, id: GuideTipId): GuideSeen {
  if (seen.dismissed.includes(id)) {
    return seen;
  }
  return { dismissed: [...seen.dismissed, id] };
}

export function restoredGuideSeen(): GuideSeen {
  return emptyGuideSeen();
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function readGuideSeen(): GuideSeen {
  const store = storage();
  if (!store) {
    return emptyGuideSeen();
  }
  try {
    return parseGuideSeen(store.getItem(GUIDE_SEEN_KEY));
  } catch {
    return emptyGuideSeen();
  }
}

export function writeGuideSeen(seen: GuideSeen): void {
  const store = storage();
  if (!store) {
    return;
  }
  try {
    store.setItem(GUIDE_SEEN_KEY, JSON.stringify(seen));
  } catch {
    // quota, private mode, or disabled storage
  }
}

export function dismissGuideTip(id: GuideTipId): GuideSeen {
  const next = withDismissedTip(readGuideSeen(), id);
  writeGuideSeen(next);
  return next;
}

export function restoreGuideTips(): GuideSeen {
  const next = restoredGuideSeen();
  writeGuideSeen(next);
  return next;
}
