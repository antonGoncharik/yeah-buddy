import {
  catalogDefaultPortion,
  catalogSearchNeedle,
  parseCatalogDumpRow,
} from "@/lib/food/catalog-map";
import { calcKcalFromMacros } from "@/lib/nutrition";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const herring = parseCatalogDumpRow({
  source: "edostavka",
  source_product_id: "2102796",
  name: "Сельдь",
  brand: "VICI",
  weight_g: 500,
  per_100: { protein: 12.8, fat: 15.5, carbs: null, kcal: 191 },
});
if (!herring) {
  throw new Error("herring missing");
}
assertEqual(herring.carbs_per_100, 0, "null carbs -> 0");
assertEqual(herring.protein_per_100, 12.8, "protein kept");
assertEqual(herring.fat_per_100, 15.5, "fat kept");
assertEqual(herring.pack_weight_g, 500, "pack weight");
assertEqual(
  "kcal" in herring,
  false,
  "dump kcal is not copied onto the catalog row",
);
assertEqual(
  calcKcalFromMacros(
    herring.protein_per_100,
    herring.fat_per_100,
    herring.carbs_per_100,
  ),
  12.8 * 4 + 15.5 * 9,
  "kcal from macros only",
);

const jam = parseCatalogDumpRow({
  source: "edostavka",
  source_product_id: "1",
  name: "Абрикос",
  per_100: { protein: null, fat: null, carbs: 58, kcal: 230 },
});
if (!jam) {
  throw new Error("jam missing");
}
assertEqual(jam.protein_per_100, 0, "null protein -> 0");
assertEqual(jam.fat_per_100, 0, "null fat -> 0");
assertEqual(jam.carbs_per_100, 58, "carbs kept");

assertEqual(parseCatalogDumpRow({ name: "no ids" }), null, "skip nameless ids");
assertEqual(catalogSearchNeedle("т"), null, "one letter is not a search");
assertEqual(catalogSearchNeedle("  творог  "), "творог", "trim query");
assertEqual(catalogSearchNeedle("foo%bar"), "foo bar", "strip ilike wildcards");

const small = catalogDefaultPortion(90);
assertEqual(small.grams, 90, "small pack is the portion");
assertEqual(small.label, "90 г", "small pack label");
const bag = catalogDefaultPortion(1000);
assertEqual(bag.grams, 100, "kilo bag stays 100 g");
assertEqual(catalogDefaultPortion(null).grams, 100, "missing pack -> 100 g");

console.log("catalog dump map ok");
