import { APP_NAME } from "@/lib/brand";
import {
  CATALOG_SOURCE_OFF,
  type CatalogDumpInput,
  parseBarcodeEan,
} from "@/lib/food/catalog-map";
import { isRecord, toNullableNumber, toNullableString } from "@/lib/read";
import { siteOriginUrl } from "@/lib/site-url";

export function catalogOffUserAgent(): string {
  return `${APP_NAME}/0.1 (${siteOriginUrl().origin})`;
}

export function parseOpenFoodFactsProduct(
  ean: string,
  data: unknown,
): CatalogDumpInput | null {
  const code = parseBarcodeEan(ean);
  if (!code || !isRecord(data) || data.status !== 1) {
    return null;
  }

  const product = isRecord(data.product) ? data.product : null;
  if (!product) {
    return null;
  }

  const name = offName(product);
  const macros = offMacros(product.nutriments);
  if (!name || !macros) {
    return null;
  }

  return {
    source: CATALOG_SOURCE_OFF,
    source_product_id: code,
    barcode: code,
    name,
    brand: offBrand(product.brands),
    pack_weight_g: offPackGrams(product),
    protein_per_100: macros.protein,
    fat_per_100: macros.fat,
    carbs_per_100: macros.carbs,
  };
}

function offName(product: Record<string, unknown>): string | null {
  return (
    toNullableString(product.product_name_ru) ??
    toNullableString(product.generic_name_ru) ??
    toNullableString(product.product_name) ??
    toNullableString(product.generic_name) ??
    toNullableString(product.product_name_en)
  );
}

function offBrand(value: unknown): string | null {
  const raw = toNullableString(value);
  if (!raw) {
    return null;
  }

  const first = raw.split(",")[0]?.trim() ?? "";
  return first === "" ? null : first;
}

function offMacros(value: unknown): {
  protein: number;
  fat: number;
  carbs: number;
} | null {
  if (!isRecord(value)) {
    return null;
  }

  const protein = offMacro(value.proteins_100g);
  const fat = offMacro(value.fat_100g);
  const carbs = offMacro(value.carbohydrates_100g);
  if (protein == null && fat == null && carbs == null) {
    return null;
  }

  return {
    protein: protein ?? 0,
    fat: fat ?? 0,
    carbs: carbs ?? 0,
  };
}

function offMacro(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function offPackGrams(product: Record<string, unknown>): number | null {
  const unit = toNullableString(product.product_quantity_unit)?.toLowerCase();
  const qty = toNullableNumber(product.product_quantity);
  if (qty != null && qty > 0) {
    if (unit === "kg" || unit === "кг") {
      return roundGrams(qty * 1000);
    }
    if (!unit || unit === "g" || unit === "гр" || unit === "г") {
      return roundGrams(qty);
    }
  }

  return parseQuantityGrams(toNullableString(product.quantity));
}

function parseQuantityGrams(raw: string | null): number | null {
  if (!raw) {
    return null;
  }

  const match = raw
    .trim()
    .replace(",", ".")
    .match(/^(\d+(?:\.\d+)?)\s*(кг|kg|гр|g|г)\s*$/i);
  if (!match) {
    return null;
  }

  const qty = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? "";
  if (!Number.isFinite(qty) || qty <= 0) {
    return null;
  }

  if (unit === "kg" || unit === "кг") {
    return roundGrams(qty * 1000);
  }

  return roundGrams(qty);
}

function roundGrams(value: number): number {
  return Math.round(value * 100) / 100;
}
