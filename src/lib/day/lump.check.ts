import { z } from "zod";

import {
  LUMP_PORTION_G,
  lumpHref,
  lumpMealItemSchema,
  macrosFromLump,
} from "@/lib/day/lump";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(LUMP_PORTION_G, 100, "portion is 100 so per-100 equals eaten");

assertEqual(
  macrosFromLump({ protein: 40, fat: 40, carbs: 60 }),
  { protein: 40, fat: 40, carbs: 60, kcal: 760 },
  "shawarma kcal",
);

assertEqual(lumpMealItemSchema.safeParse({}).success, false, "empty fails");
assertEqual(
  lumpMealItemSchema.safeParse({
    name: "шаурма",
    protein: 0,
    fat: 0,
    carbs: 0,
  }).success,
  false,
  "all zero fails",
);
assertEqual(
  lumpMealItemSchema.safeParse({
    name: "шаурма",
    protein: 40,
    fat: 40,
    carbs: 60,
  }).success,
  true,
  "shawarma ok",
);

assertEqual(
  lumpHref("/today/meals/m1/add/lump", "шаурма"),
  "/today/meals/m1/add/lump?name=%D1%88%D0%B0%D1%83%D1%80%D0%BC%D0%B0",
  "name query",
);
assertEqual(
  lumpHref("/today/meals/m1/add/lump?date=2026-09-11", "обед"),
  "/today/meals/m1/add/lump?date=2026-09-11&name=%D0%BE%D0%B1%D0%B5%D0%B4",
  "keeps date",
);
assertEqual(
  lumpHref("/today/meals/m1/add/lump", "  "),
  "/today/meals/m1/add/lump",
  "blank name stays bare",
);

const postSchema = z.union([
  lumpMealItemSchema,
  z.object({
    foodId: z.string().min(1),
    grams: z.number().finite().positive(),
  }),
]);
assertEqual(
  postSchema.safeParse({ foodId: "f1", grams: 80 }).success,
  true,
  "catalog payload",
);
assertEqual(
  postSchema.safeParse({
    name: "шаурма",
    protein: 40,
    fat: 40,
    carbs: 60,
  }).success,
  true,
  "lump payload",
);
assertEqual(
  "foodId" in (postSchema.safeParse({ foodId: "f1", grams: 80 }).data ?? {}),
  true,
  "catalog branch has foodId",
);
assertEqual(
  "foodId" in
    (postSchema.safeParse({
      name: "шаурма",
      protein: 40,
      fat: 40,
      carbs: 60,
    }).data ?? {}),
  false,
  "lump branch has no foodId",
);

const patchSchema = z.union([
  lumpMealItemSchema,
  z.object({
    grams: z.number().finite().positive(),
  }),
]);
assertEqual(
  "grams" in (patchSchema.safeParse({ grams: 50 }).data ?? {}),
  true,
  "grams patch",
);
assertEqual(
  "grams" in
    (patchSchema.safeParse({
      name: "шаурма",
      protein: 40,
      fat: 40,
      carbs: 60,
    }).data ?? {}),
  false,
  "lump patch has no grams",
);

console.log("lump meal ok");
