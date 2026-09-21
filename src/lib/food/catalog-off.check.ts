import { APP_NAME } from "@/lib/brand";
import {
  catalogOffUserAgent,
  parseOpenFoodFactsProduct,
} from "@/lib/food/catalog-off";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const ean = "4600605021084";
const hit = parseOpenFoodFactsProduct(ean, {
  status: 1,
  product: {
    product_name_ru: "Творог",
    product_name: "Cottage cheese",
    brands: "Простоквашино, Danone",
    nutriments: {
      proteins_100g: 16.3,
      fat_100g: 5,
      carbohydrates_100g: 1.8,
    },
    product_quantity: 180,
    product_quantity_unit: "g",
  },
});
if (!hit) {
  throw new Error("off hit missing");
}
assertEqual(hit.source, "off", "source");
assertEqual(hit.source_product_id, ean, "source id is ean");
assertEqual(hit.barcode, ean, "barcode");
assertEqual(hit.name, "Творог", "russian name first");
assertEqual(hit.brand, "Простоквашино", "first brand");
assertEqual(hit.protein_per_100, 16.3, "protein");
assertEqual(hit.fat_per_100, 5, "fat");
assertEqual(hit.carbs_per_100, 1.8, "carbs");
assertEqual(hit.pack_weight_g, 180, "pack grams");

assertEqual(
  parseOpenFoodFactsProduct(ean, { status: 0 }),
  null,
  "unknown product",
);
assertEqual(
  parseOpenFoodFactsProduct(ean, {
    status: 1,
    product: { product_name: "Water", nutriments: {} },
  }),
  null,
  "no macros",
);
assertEqual(
  parseOpenFoodFactsProduct("123", {
    status: 1,
    product: { product_name: "X" },
  }),
  null,
  "bad ean",
);

const packFromQty = parseOpenFoodFactsProduct("12345678", {
  status: 1,
  product: {
    product_name: "Bar",
    nutriments: { proteins_100g: 10, fat_100g: 0, carbohydrates_100g: 0 },
    quantity: "90 г",
  },
});
assertEqual(packFromQty?.pack_weight_g, 90, "quantity grams");
assertEqual(packFromQty?.protein_per_100, 10, "zero fat still a hit");

const kilo = parseOpenFoodFactsProduct("12345678", {
  status: 1,
  product: {
    product_name: "Bag",
    nutriments: { fat_100g: 1 },
    product_quantity: 0.5,
    product_quantity_unit: "kg",
  },
});
assertEqual(kilo?.pack_weight_g, 500, "kg pack");
assertEqual(kilo?.protein_per_100, 0, "missing protein -> 0");

assertEqual(
  catalogOffUserAgent().startsWith(`${APP_NAME}/0.1 (`),
  true,
  "user-agent names the app",
);

console.log("catalog off map ok");
