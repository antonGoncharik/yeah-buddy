import {
  catalogDefaultPortion,
  catalogSearchLead,
  catalogSearchNeedle,
  catalogSearchTokens,
  filterCatalogHits,
  foodMatchesQuery,
  ownsBarcode,
  parseBarcodeEan,
  parseCatalogDumpRow,
  parseCatalogFoodPayload,
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

assertEqual("barcode" in herring, false, "dump without ean keeps barcode off");
assertEqual(parseCatalogDumpRow({ name: "no ids" }), null, "skip nameless ids");

const coded = parseCatalogDumpRow({
  source: "edostavka",
  source_product_id: "9",
  barcode: "4600605021084",
  name: "Код",
  per_100: { protein: 1, fat: 1, carbs: 1 },
});
assertEqual(coded?.barcode, "4600605021084", "dump barcode kept");
assertEqual(parseBarcodeEan(" 4600605021084 "), "4600605021084", "ean trim");
assertEqual(parseBarcodeEan("1234567"), null, "7 digits is not ean");
assertEqual(parseBarcodeEan("12345678") != null, true, "ean-8");
assertEqual(parseBarcodeEan("12345678901234") != null, true, "gtin-14");
assertEqual(parseBarcodeEan("123456789012345"), null, "15 digits is not ean");
assertEqual(parseBarcodeEan("460060502108a"), null, "letters are not ean");
assertEqual(
  parseCatalogFoodPayload({
    food: {
      id: "c1",
      name: "Код",
      brand: null,
      pack_weight_g: 90,
      protein_per_100: 1,
      fat_per_100: 2,
      carbs_per_100: 3,
      kcal_per_100: 34,
    },
  })?.id,
  "c1",
  "barcode payload",
);
assertEqual(catalogSearchNeedle("т"), null, "one letter is not a search");
assertEqual(catalogSearchNeedle("  творог  "), "творог", "trim query");
assertEqual(catalogSearchNeedle("foo%bar"), "foo bar", "strip ilike wildcards");
assertEqual(catalogSearchNeedle("чёрный"), "черный", "fold yo before search");

const brandTokens = catalogSearchTokens("Простоквашино кефир");
assertEqual(brandTokens?.join(" "), "простоквашино кефир", "split tokens");
assertEqual(
  catalogSearchLead(brandTokens ?? []),
  "простоквашино",
  "longest token leads the sql",
);
assertEqual(
  catalogSearchTokens("шаурма из кафе")?.join(" "),
  "шаурма кафе",
  "drop prepositions",
);
assertEqual(
  catalogSearchTokens("а б") == null,
  true,
  "short tokens are not a catalog search",
);

assertEqual(
  foodMatchesQuery("Кефир 2.5%", "Простоквашино", "простоквашино кефир"),
  true,
  "tokens match across name and brand",
);
assertEqual(
  foodMatchesQuery("Кефир 2.5%", "Простоквашино", "простоквашино творог"),
  false,
  "missing token is a miss",
);
assertEqual(
  foodMatchesQuery("Чёрный хлеб", null, "черный"),
  true,
  "yo folded in the list",
);
assertEqual(
  foodMatchesQuery("Пачка", null, "4600605021084", "4600605021084"),
  true,
  "scan hits the saved code",
);
assertEqual(
  foodMatchesQuery("4600605021084", null, "4600605021084", null),
  false,
  "scan does not match a name",
);
assertEqual(
  foodMatchesQuery("Творог", null, "творог", "4600605021084"),
  true,
  "name search ignores the code",
);
assertEqual(
  ownsBarcode([{ barcode: "4600605021084" }], "4600605021084"),
  true,
  "owned code",
);
assertEqual(
  ownsBarcode([{ barcode: null }], "4600605021084"),
  false,
  "no code",
);

const mixed = filterCatalogHits(
  [
    { name: "Кефир 1%", brand: "Домик в деревне" },
    { name: "Кефир 2.5%", brand: "Простоквашино" },
    { name: "Творог", brand: "Простоквашино" },
  ],
  ["простоквашино", "кефир"],
);
assertEqual(mixed.length, 1, "and-filter leftover tokens");
assertEqual(mixed[0]?.name, "Кефир 2.5%", "keeps the matching sku");

const small = catalogDefaultPortion(90);
assertEqual(small.grams, 90, "small pack is the portion");
assertEqual(small.label, "90 г", "small pack label");
const bag = catalogDefaultPortion(1000);
assertEqual(bag.grams, 100, "kilo bag stays 100 g");
assertEqual(catalogDefaultPortion(null).grams, 100, "missing pack -> 100 g");

console.log("catalog dump map ok");
