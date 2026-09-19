import { isRecord } from "@/lib/read";

export const REVIEW_SEEN_KEY = "yb.review.offer";

export function parseReviewOfferSeen(raw: unknown): boolean {
  if (typeof raw === "string") {
    try {
      return parseReviewOfferSeen(JSON.parse(raw));
    } catch {
      return false;
    }
  }
  return isRecord(raw) && raw.seen === true;
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function isReviewOfferSeen(): boolean {
  const store = storage();
  if (!store) {
    return false;
  }
  try {
    return parseReviewOfferSeen(store.getItem(REVIEW_SEEN_KEY));
  } catch {
    return false;
  }
}

export function markReviewOfferSeen(): void {
  const store = storage();
  if (!store) {
    return;
  }
  try {
    store.setItem(REVIEW_SEEN_KEY, JSON.stringify({ seen: true }));
  } catch {
    // quota, private mode, or disabled storage
  }
}
