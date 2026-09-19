import { shiftIsoDate } from "@/lib/day/dates";
import { isRecord } from "@/lib/read";

export const FAVORITE_OFFER_WINDOW_DAYS = 4;
export const FAVORITE_OFFER_MIN_DAYS = 3;
export const FAVORITE_OFFER_SEEN_KEY = "yb.favorite.offer";

export interface FavoriteOffer {
  foodId: string;
  name: string;
}

export interface FavoriteOfferHit {
  foodId: string;
  name: string;
  isFavorite: boolean;
  date: string;
}

export function favoriteOfferWindowStart(today: string): string {
  return shiftIsoDate(today, 1 - FAVORITE_OFFER_WINDOW_DAYS);
}

export function rankFavoriteOffers(
  hits: readonly FavoriteOfferHit[],
  today: string,
): FavoriteOffer[] {
  const start = favoriteOfferWindowStart(today);
  const byFood = new Map<string, { name: string; dates: Set<string> }>();

  for (const hit of hits) {
    if (
      hit.isFavorite ||
      hit.foodId === "" ||
      hit.date < start ||
      hit.date > today
    ) {
      continue;
    }
    const current = byFood.get(hit.foodId) ?? {
      name: hit.name.trim(),
      dates: new Set<string>(),
    };
    if (current.name === "") {
      current.name = hit.name.trim();
    }
    current.dates.add(hit.date);
    byFood.set(hit.foodId, current);
  }

  const ranked = [...byFood.entries()]
    .flatMap(([foodId, current]) => {
      if (current.name === "" || current.dates.size < FAVORITE_OFFER_MIN_DAYS) {
        return [];
      }
      return [{ foodId, name: current.name, days: current.dates.size }];
    })
    .sort((left, right) => {
      if (right.days !== left.days) {
        return right.days - left.days;
      }
      const names = left.name.localeCompare(right.name, "ru");
      if (names !== 0) {
        return names;
      }
      return left.foodId.localeCompare(right.foodId);
    });

  return ranked.map(({ foodId, name }) => ({ foodId, name }));
}

export function pickFavoriteOffer(
  offers: readonly FavoriteOffer[],
  dismissedIds: readonly string[],
): FavoriteOffer | null {
  const skipped = new Set(dismissedIds);
  return offers.find((offer) => !skipped.has(offer.foodId)) ?? null;
}

export function parseFavoriteOffer(value: unknown): FavoriteOffer | null {
  if (!isRecord(value) || typeof value.foodId !== "string") {
    return null;
  }
  if (typeof value.name !== "string") {
    return null;
  }
  const foodId = value.foodId.trim();
  const name = value.name.trim();
  if (foodId === "" || name === "") {
    return null;
  }
  return { foodId, name };
}

export function readFavoriteOffers(data: unknown): FavoriteOffer[] {
  if (!isRecord(data) || !Array.isArray(data.favoriteOffers)) {
    return [];
  }
  const offers: FavoriteOffer[] = [];
  const seen = new Set<string>();
  for (const item of data.favoriteOffers) {
    const offer = parseFavoriteOffer(item);
    if (!offer || seen.has(offer.foodId)) {
      continue;
    }
    seen.add(offer.foodId);
    offers.push(offer);
  }
  return offers;
}

export function parseFavoriteOfferDismissed(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      return parseFavoriteOfferDismissed(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (!isRecord(raw) || !Array.isArray(raw.dismissed)) {
    return [];
  }
  const dismissed: string[] = [];
  for (const item of raw.dismissed) {
    if (typeof item !== "string" || item === "" || dismissed.includes(item)) {
      continue;
    }
    dismissed.push(item);
  }
  return dismissed;
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function readFavoriteOfferDismissed(): string[] {
  const store = storage();
  if (!store) {
    return [];
  }
  try {
    return parseFavoriteOfferDismissed(store.getItem(FAVORITE_OFFER_SEEN_KEY));
  } catch {
    return [];
  }
}

export function dismissFavoriteOffer(foodId: string): string[] {
  const trimmed = foodId.trim();
  const current = readFavoriteOfferDismissed();
  if (trimmed === "" || current.includes(trimmed)) {
    return current;
  }
  const next = [...current, trimmed];
  const store = storage();
  if (!store) {
    return next;
  }
  try {
    store.setItem(FAVORITE_OFFER_SEEN_KEY, JSON.stringify({ dismissed: next }));
  } catch {
    // quota, private mode, or disabled storage
  }
  return next;
}
