import {
  compactPlateCatalog,
  normalizeFoodName,
  rankPlateCatalog,
} from "@/lib/ai/plate-catalog";
import { resolvePlateItems, roundPlateGrams } from "@/lib/ai/plate-match";
import { parsePlateDraft, parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateFoodRef, PlateModelItem } from "@/lib/ai/plate-types";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

function food(
  id: string,
  name: string,
  extras: Partial<PlateFoodRef> = {},
): PlateFoodRef {
  return {
    id,
    name,
    state: extras.state ?? "as_is",
    protein_per_100: extras.protein_per_100 ?? 10,
    fat_per_100: extras.fat_per_100 ?? 5,
    carbs_per_100: extras.carbs_per_100 ?? 20,
    kcal_per_100: extras.kcal_per_100 ?? 165,
    default_portion_g: extras.default_portion_g ?? null,
    default_portion_label: extras.default_portion_label ?? null,
  };
}

function raw(
  input: Partial<PlateModelItem> & { name: string; grams: number },
): PlateModelItem {
  return {
    catalog_i: input.catalog_i ?? -1,
    name: input.name,
    grams: input.grams,
    state: input.state ?? "as_is",
    protein_per_100: input.protein_per_100 ?? null,
    fat_per_100: input.fat_per_100 ?? null,
    carbs_per_100: input.carbs_per_100 ?? null,
  };
}

assertEqual(roundPlateGrams(0), 0, "zero grams");
assertEqual(roundPlateGrams(7), 7, "small grams");
assertEqual(roundPlateGrams(12), 10, "round down 5");
assertEqual(roundPlateGrams(13), 15, "round up 5");
assertEqual(roundPlateGrams(2000), 1500, "clamp grams");
assertEqual(normalizeFoodName("Творог  5%"), "творог 5", "normalize name");
assertEqual(normalizeFoodName("Овёс"), "овес", "yo to e");

const catalogFoods = [
  food("oats", "Овсянка сухая", {
    state: "dry",
    protein_per_100: 13,
    fat_per_100: 6,
    carbs_per_100: 66,
    kcal_per_100: 370,
  }),
  food("curd", "Творог 5%", {
    protein_per_100: 17,
    fat_per_100: 5,
    carbs_per_100: 2,
    kcal_per_100: 121,
  }),
];

const catalog = compactPlateCatalog(catalogFoods);
assertEqual(catalog[0]?.i, 0, "catalog index 0");
assertEqual(catalog[1]?.n, "Творог 5%", "catalog name");

const byIndex = resolvePlateItems(
  [
    raw({
      catalog_i: 0,
      name: "каша",
      grams: 62,
      protein_per_100: 99,
      fat_per_100: 99,
      carbs_per_100: 99,
    }),
  ],
  catalogFoods,
);
assertEqual(byIndex.length, 1, "matched one");
assertEqual(byIndex[0]?.kind, "food", "matched kind");
if (byIndex[0]?.kind === "food") {
  assertEqual(byIndex[0].foodId, "oats", "matched id");
  assertEqual(byIndex[0].name, "Овсянка сухая", "own name");
  assertEqual(byIndex[0].protein_per_100, 13, "own macros");
  assertEqual(byIndex[0].grams, 60, "rounded grams");
}

const byName = resolvePlateItems(
  [raw({ name: "творог 5%", grams: 150 })],
  catalogFoods,
);
assertEqual(byName[0]?.kind, "food", "name match kind");
if (byName[0]?.kind === "food") {
  assertEqual(byName[0].foodId, "curd", "name match id");
}

const ambiguous = resolvePlateItems(
  [
    raw({
      name: "творог",
      grams: 100,
      protein_per_100: 18,
      fat_per_100: 0,
      carbs_per_100: 2,
    }),
  ],
  [
    ...catalogFoods,
    food("curd0", "Творог 0%", {
      protein_per_100: 18,
      fat_per_100: 0,
      carbs_per_100: 2,
      kcal_per_100: 80,
    }),
  ],
);
assertEqual(ambiguous[0]?.kind, "new", "ambiguous stays new");

const created = resolvePlateItems(
  [
    raw({
      name: "Хумус",
      grams: 40,
      protein_per_100: 8,
      fat_per_100: 17,
      carbs_per_100: 14,
    }),
  ],
  catalogFoods,
);
assertEqual(created[0]?.kind, "new", "new food");
if (created[0]?.kind === "new") {
  assertEqual(created[0].name, "Хумус", "new name");
  assertEqual(created[0].kcal_per_100, 8 * 4 + 17 * 9 + 14 * 4, "kcal formula");
}

const dropped = resolvePlateItems(
  [raw({ name: "Соус", grams: 20 })],
  catalogFoods,
);
assertEqual(dropped.length, 0, "drop without macros");

const merged = resolvePlateItems(
  [
    raw({ catalog_i: 1, name: "творог", grams: 100 }),
    raw({ catalog_i: 1, name: "ещё творог", grams: 50 }),
  ],
  catalogFoods,
);
assertEqual(merged.length, 1, "merge same food");
assertEqual(merged[0]?.grams, 150, "merged grams");

const parsed = parsePlateModelItems({
  items: [
    { catalog_i: 0, name: "Овсянка", grams: 50 },
    { name: "", grams: 10 },
  ],
});
assertEqual(parsed?.length, 1, "skip empty model name");

const draft = parsePlateDraft({
  items: [
    {
      kind: "food",
      foodId: "oats",
      name: "Овсянка сухая",
      grams: 60,
      protein_per_100: 13,
      fat_per_100: 6,
      carbs_per_100: 66,
      kcal_per_100: 370,
    },
  ],
});
assertEqual(draft?.items[0]?.kind, "food", "parse draft food");
if (draft?.items[0]?.kind === "food") {
  assertEqual(draft.items[0].default_portion_g, null, "draft portion empty");
}
assertEqual(
  parsePlateDraft({ items: [{ kind: "food", grams: 10 }] }),
  null,
  "reject bad draft",
);

const favoritesFirst = rankPlateCatalog(
  [
    { id: "zucchini", is_favorite: false },
    { id: "oats", is_favorite: true },
    { id: "curd", is_favorite: false },
  ],
  [{ id: "curd", is_favorite: false }],
  2,
);
assertEqual(favoritesFirst[0]?.id, "oats", "favorite first");
assertEqual(favoritesFirst[1]?.id, "curd", "recent second");
assertEqual(favoritesFirst.length, 2, "catalog cap");

const allFoods = [
  food("alpha", "Авокадо"),
  food("oats", "Овсянка сухая", {
    protein_per_100: 13,
    fat_per_100: 6,
    carbs_per_100: 66,
    kcal_per_100: 370,
    default_portion_g: 40,
    default_portion_label: "пакет",
  }),
];
const rankedCatalog = [allFoods[1], allFoods[0]].filter(
  (item): item is PlateFoodRef => item != null,
);
const byRank = resolvePlateItems(
  [raw({ catalog_i: 0, name: "каша", grams: 40 })],
  rankedCatalog,
  allFoods,
);
assertEqual(byRank[0]?.kind, "food", "ranked catalog kind");
if (byRank[0]?.kind === "food") {
  assertEqual(byRank[0].foodId, "oats", "catalog_i uses ranked list");
  assertEqual(byRank[0].default_portion_g, 40, "keeps portion");
}

const outside = resolvePlateItems(
  [raw({ name: "авокадо", grams: 80 })],
  rankedCatalog.slice(0, 1),
  allFoods,
);
assertEqual(outside[0]?.kind, "food", "name match outside catalog");
if (outside[0]?.kind === "food") {
  assertEqual(outside[0].foodId, "alpha", "matched all foods");
}

console.log("ai plate ok");
