import {
  FAVORITE_OFFER_MIN_DAYS,
  FAVORITE_OFFER_SEEN_KEY,
  FAVORITE_OFFER_WINDOW_DAYS,
  type FavoriteOfferHit,
  favoriteOfferWindowStart,
  parseFavoriteOffer,
  parseFavoriteOfferDismissed,
  pickFavoriteOffer,
  rankFavoriteOffers,
  readFavoriteOffers,
} from "@/lib/food/favorite-offer";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const today = "2026-09-19";

function hit(
  foodId: string,
  date: string,
  extra?: Partial<FavoriteOfferHit>,
): FavoriteOfferHit {
  return {
    foodId,
    name: extra?.name ?? foodId,
    isFavorite: extra?.isFavorite ?? false,
    date,
  };
}

assertEqual(FAVORITE_OFFER_WINDOW_DAYS, 4, "four-day window");
assertEqual(FAVORITE_OFFER_MIN_DAYS, 3, "three days is enough");
assertEqual(favoriteOfferWindowStart(today), "2026-09-16", "window start");
assertEqual(FAVORITE_OFFER_SEEN_KEY, "yb.favorite.offer", "storage key");

assertEqual(
  rankFavoriteOffers(
    [
      hit("curd", "2026-09-16", { name: "Творог" }),
      hit("curd", "2026-09-17", { name: "Творог" }),
      hit("curd", "2026-09-18", { name: "Творог" }),
    ],
    today,
  )[0]?.foodId,
  "curd",
  "three of last four days",
);

assertEqual(
  rankFavoriteOffers(
    [hit("curd", "2026-09-17"), hit("curd", "2026-09-18"), hit("curd", today)],
    today,
  ).length,
  1,
  "today counts",
);

assertEqual(
  rankFavoriteOffers(
    [
      hit("curd", "2026-09-16"),
      hit("curd", "2026-09-16"),
      hit("curd", "2026-09-17"),
      hit("curd", "2026-09-18"),
    ],
    today,
  ).length,
  1,
  "same day twice is one day",
);

assertEqual(
  rankFavoriteOffers(
    [hit("curd", "2026-09-17"), hit("curd", "2026-09-18")],
    today,
  ).length,
  0,
  "two days is not a habit yet",
);

assertEqual(
  rankFavoriteOffers(
    [
      hit("curd", "2026-09-12"),
      hit("curd", "2026-09-13"),
      hit("curd", "2026-09-14"),
      hit("curd", "2026-09-15"),
    ],
    today,
  ).length,
  0,
  "outside the window",
);

assertEqual(
  rankFavoriteOffers(
    [
      hit("curd", "2026-09-16", { isFavorite: true, name: "Творог" }),
      hit("curd", "2026-09-17", { isFavorite: true, name: "Творог" }),
      hit("curd", "2026-09-18", { isFavorite: true, name: "Творог" }),
    ],
    today,
  ).length,
  0,
  "already favorite",
);

const ranked = rankFavoriteOffers(
  [
    hit("oats", "2026-09-16", { name: "Овсянка" }),
    hit("oats", "2026-09-17", { name: "Овсянка" }),
    hit("oats", "2026-09-18", { name: "Овсянка" }),
    hit("curd", "2026-09-16", { name: "Творог" }),
    hit("curd", "2026-09-17", { name: "Творог" }),
    hit("curd", "2026-09-18", { name: "Творог" }),
    hit("curd", today, { name: "Творог" }),
  ],
  today,
);
assertEqual(ranked[0]?.foodId, "curd", "more days first");
assertEqual(ranked[1]?.foodId, "oats", "second habit stays queued");

assertEqual(
  rankFavoriteOffers(
    [
      hit("oats", "2026-09-16", { name: "Овсянка" }),
      hit("oats", "2026-09-17", { name: "Овсянка" }),
      hit("oats", "2026-09-18", { name: "Овсянка" }),
      hit("curd", "2026-09-16", { name: "Творог" }),
      hit("curd", "2026-09-17", { name: "Творог" }),
      hit("curd", "2026-09-18", { name: "Творог" }),
    ],
    today,
  )
    .map((row) => row.foodId)
    .join(),
  "oats,curd",
  "same streak sorts by name",
);

assertEqual(
  pickFavoriteOffer(ranked, ["curd"])?.foodId,
  "oats",
  "dismissed top food yields the next",
);
assertEqual(pickFavoriteOffer(ranked, ["curd", "oats"]), null, "all dismissed");
assertEqual(pickFavoriteOffer([], []), null, "empty");

assertEqual(parseFavoriteOffer(null), null, "null offer");
assertEqual(parseFavoriteOffer({ foodId: "curd" }), null, "name required");
assertEqual(
  parseFavoriteOffer({ foodId: " curd ", name: " Творог " })?.name,
  "Творог",
  "trimmed offer",
);

assertEqual(
  readFavoriteOffers({ favoriteOffers: "nope" }).length,
  0,
  "bad list",
);
assertEqual(
  readFavoriteOffers({
    favoriteOffers: [
      { foodId: "curd", name: "Творог" },
      { foodId: "curd", name: "Again" },
      { foodId: "", name: "Nope" },
    ],
  })
    .map((row) => row.foodId)
    .join(),
  "curd",
  "drops junk and dupes",
);

assertEqual(parseFavoriteOfferDismissed(null).length, 0, "null dismissed");
assertEqual(parseFavoriteOfferDismissed("{").length, 0, "broken json");
assertEqual(
  parseFavoriteOfferDismissed({ dismissed: ["curd", "", "curd", 1] }).join(),
  "curd",
  "dismissed ids",
);
assertEqual(
  parseFavoriteOfferDismissed('{"dismissed":["curd"]}').join(),
  "curd",
  "json string dismissed",
);

console.log("favorite offer ok");
