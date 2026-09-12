import {
  compactPlateCatalog,
  foodNameStem,
  normalizeFoodName,
  rankPlateCatalog,
} from "@/lib/ai/plate-catalog";
import { plateCommitSchema } from "@/lib/ai/plate-commit";
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
    yield_from_g: extras.yield_from_g ?? null,
    yield_to_g: extras.yield_to_g ?? null,
  };
}

function raw(
  input: Partial<PlateModelItem> & { name: string; grams?: number },
): PlateModelItem {
  return {
    catalog_i: input.catalog_i ?? -1,
    name: input.name,
    grams: input.grams ?? 0,
    state: input.state ?? "as_is",
    protein: input.protein ?? null,
    fat: input.fat ?? null,
    carbs: input.carbs ?? null,
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
assertEqual(ambiguous[0]?.kind, "lump", "ambiguous stays lump");

const created = resolvePlateItems(
  [
    raw({
      name: "Хумус",
      protein: 8,
      fat: 17,
      carbs: 14,
    }),
  ],
  catalogFoods,
);
assertEqual(created[0]?.kind, "lump", "unknown is lump");
if (created[0]?.kind === "lump") {
  assertEqual(created[0].name, "Хумус", "lump name");
  assertEqual(created[0].kcal, 8 * 4 + 17 * 9 + 14 * 4, "portion kcal");
}

const fromPer100 = resolvePlateItems(
  [
    raw({
      name: "Хумус",
      grams: 50,
      protein_per_100: 8,
      fat_per_100: 17,
      carbs_per_100: 14,
    }),
  ],
  catalogFoods,
);
assertEqual(fromPer100[0]?.kind, "lump", "per-100 unknown becomes lump");
if (fromPer100[0]?.kind === "lump") {
  assertEqual(fromPer100[0].protein, 4, "portion from per-100");
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
const parsedLump = parsePlateDraft({
  items: [
    {
      kind: "lump",
      name: "шаурма",
      protein: 40,
      fat: 40,
      carbs: 60,
      kcal: 760,
    },
  ],
});
assertEqual(parsedLump?.items[0]?.kind, "lump", "parse draft lump");
assertEqual(
  parsePlateDraft({ items: [{ kind: "food", grams: 10 }] }),
  null,
  "reject bad draft",
);

const mergedLumps = resolvePlateItems(
  [
    raw({ name: "шаурма", protein: 20, fat: 20, carbs: 30 }),
    raw({ name: "Шаурма", protein: 20, fat: 20, carbs: 30 }),
  ],
  catalogFoods,
);
assertEqual(mergedLumps.length, 1, "merge same lump name");
if (mergedLumps[0]?.kind === "lump") {
  assertEqual(mergedLumps[0].protein, 40, "merged lump protein");
}

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

assertEqual(foodNameStem("Куриное филе сырое"), "куриное филе", "stem raw");
assertEqual(
  foodNameStem("Куриное филе варёное"),
  "куриное филе",
  "stem cooked",
);

const chickenRaw = food("chicken-raw", "Куриное филе сырое", {
  state: "raw",
  protein_per_100: 23,
  fat_per_100: 2,
  carbs_per_100: 0,
  kcal_per_100: 110,
  yield_from_g: 150,
  yield_to_g: 110,
});
const chickenCooked = food("chicken-cooked", "Куриное филе варёное", {
  state: "cooked",
  protein_per_100: 30,
  fat_per_100: 4,
  carbs_per_100: 0,
  kcal_per_100: 156,
});
const remapped = resolvePlateItems(
  [raw({ catalog_i: 1, name: "филе", grams: 110, state: "cooked" })],
  [chickenRaw, chickenCooked],
);
assertEqual(remapped[0]?.kind, "food", "remap kind");
if (remapped[0]?.kind === "food") {
  assertEqual(remapped[0].foodId, "chicken-raw", "cooked twin uses raw");
  assertEqual(remapped[0].grams, 110, "plate grams stay cooked");
  assertEqual(remapped[0].yield_from_g, 150, "keeps yield from");
}

const withYield = compactPlateCatalog([chickenRaw]);
assertEqual(withYield[0]?.y?.[0], 150, "catalog yield from");
assertEqual(withYield[0]?.y?.[1], 110, "catalog yield to");

assertEqual(
  plateCommitSchema.safeParse({
    items: [{ kind: "lump", name: "шаурма", protein: 40, fat: 40, carbs: 60 }],
  }).success,
  true,
  "commit lump",
);
assertEqual(
  plateCommitSchema.safeParse({
    items: [{ kind: "lump", name: "x", protein: 0, fat: 0, carbs: 0 }],
  }).success,
  false,
  "empty lump rejected",
);
assertEqual(
  plateCommitSchema.safeParse({
    items: [{ kind: "food", foodId: "f1", grams: 80 }],
  }).success,
  true,
  "commit food",
);

console.log("ai plate ok");
