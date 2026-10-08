import { calcKcalFromMacros } from "@/lib/nutrition";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/read";

export const CATALOG_SEARCH_MIN = 2;
export const CATALOG_SEARCH_LIMIT = 40;
export const CATALOG_SEARCH_FETCH = 120;
export const CATALOG_SEARCH_TOKEN_MAX = 5;
export const CATALOG_SOURCE_OFF = "off";
export const CATALOG_SOURCE_CALORIZATOR = "calorizator";
export const BARCODE_EAN = /^\d{8,14}$/;
/** Pack weights up to this use the full pack as default portion; larger (e.g. 1 kg) stay at 100 g. */
export const CATALOG_PACK_PORTION_MAX_G = 500;

const CATALOG_SEARCH_STOP = new Set([
  "из",
  "на",
  "от",
  "до",
  "по",
  "за",
  "со",
  "ко",
  "во",
  "не",
  "ни",
  "или",
  "для",
  "без",
  "при",
  "про",
  "and",
  "the",
  "of",
]);

export interface CatalogDumpInput {
  source: string;
  source_product_id: string;
  barcode?: string | null;
  name: string;
  brand: string | null;
  pack_weight_g: number | null;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
}

export interface CatalogFood {
  id: string;
  name: string;
  brand: string | null;
  pack_weight_g: number | null;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
}

export function parseCatalogDumpRow(value: unknown): CatalogDumpInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const source = toNullableString(value.source);
  const sourceProductId = catalogSourceId(value.source_product_id);
  const name = toNullableString(value.name);
  if (!source || !sourceProductId || !name) {
    return null;
  }

  const per100 = isRecord(value.per_100) ? value.per_100 : {};
  const pack = positiveGrams(value.weight_g);
  const barcode = parseBarcodeEan(
    typeof value.barcode === "number"
      ? String(value.barcode)
      : (toNullableString(value.barcode) ?? toNullableString(value.ean) ?? ""),
  );

  return {
    source,
    source_product_id: sourceProductId,
    ...(barcode ? { barcode } : {}),
    name,
    brand: toNullableString(value.brand),
    pack_weight_g: pack,
    protein_per_100: catalogMacro(per100.protein),
    fat_per_100: catalogMacro(per100.fat),
    carbs_per_100: catalogMacro(per100.carbs),
  };
}

export function parseBarcodeEan(raw: string): string | null {
  const trimmed = raw.trim();
  return BARCODE_EAN.test(trimmed) ? trimmed : null;
}

export function mapCatalogFood(row: Record<string, unknown>): CatalogFood {
  const protein = toNumber(row.protein_per_100);
  const fat = toNumber(row.fat_per_100);
  const carbs = toNumber(row.carbs_per_100);
  return {
    id: String(row.id),
    name: String(row.name),
    brand: toNullableString(row.brand),
    pack_weight_g: toNullableNumber(row.pack_weight_g),
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100:
      toNumber(row.kcal_per_100) || calcKcalFromMacros(protein, fat, carbs),
  };
}

export function parseCatalogFood(value: unknown): CatalogFood | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapCatalogFood(value);
}

export function parseCatalogFoodList(data: unknown): CatalogFood[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.foods, parseCatalogFood);
}

export function parseCatalogFoodPayload(data: unknown): CatalogFood | null {
  return isRecord(data) ? parseCatalogFood(data.food) : null;
}

export function foldCatalogSearch(value: string): string {
  return value.replace(/ё/gi, "е");
}

/** Stable key for cross-source catalog import dedupe (name formatting may differ). */
export function catalogDedupeFingerprint(input: {
  name: string;
  brand: string | null;
  pack_weight_g: number | null;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
}): string {
  const text = catalogDedupeText(`${input.name} ${input.brand ?? ""}`);
  const weight =
    input.pack_weight_g != null && input.pack_weight_g > 0
      ? String(Math.round(input.pack_weight_g * 100) / 100)
      : "";
  const protein = catalogDedupeMacro(input.protein_per_100);
  const fat = catalogDedupeMacro(input.fat_per_100);
  const carbs = catalogDedupeMacro(input.carbs_per_100);
  return `${text}\0${weight}\0${protein}\0${fat}\0${carbs}`;
}

export function catalogSearchNeedle(raw: string): string | null {
  const trimmed = foldCatalogSearch(raw)
    .trim()
    .replace(/[%_,.()'"`\\*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (trimmed.length < CATALOG_SEARCH_MIN) {
    return null;
  }

  return trimmed.slice(0, 80);
}

export function catalogSearchTokens(raw: string): string[] | null {
  const needle = catalogSearchNeedle(raw);
  if (!needle) {
    return null;
  }

  const tokens: string[] = [];
  for (const part of needle.toLowerCase().split(" ")) {
    if (
      part.length < CATALOG_SEARCH_MIN ||
      CATALOG_SEARCH_STOP.has(part) ||
      tokens.includes(part)
    ) {
      continue;
    }
    tokens.push(part);
    if (tokens.length >= CATALOG_SEARCH_TOKEN_MAX) {
      break;
    }
  }

  return tokens.length > 0 ? tokens : null;
}

export function catalogSearchLead(tokens: string[]): string {
  return tokens.reduce((lead, token) =>
    token.length > lead.length ? token : lead,
  );
}

export function foodMatchesQuery(
  name: string,
  brand: string | null,
  query: string,
  barcode?: string | null,
): boolean {
  const ean = parseBarcodeEan(query);
  if (ean) {
    return barcode === ean;
  }

  const haystack = catalogHaystack(name, brand);
  const tokens = catalogSearchTokens(query);
  if (tokens) {
    return tokens.every((token) => haystack.includes(token));
  }

  const needle = foldCatalogSearch(query.trim().toLowerCase());
  return needle.length === 0 || haystack.includes(needle);
}

export function ownsBarcode(
  foods: ReadonlyArray<{ barcode?: string | null }>,
  query: string,
): boolean {
  const ean = parseBarcodeEan(query);
  if (!ean) {
    return false;
  }
  return foods.some((food) => food.barcode === ean);
}

/** Higher = better match for catalog / food list search ordering. */
export function catalogFoodSearchScore(
  name: string,
  brand: string | null,
  tokens: string[],
): number {
  if (tokens.length === 0) {
    return 0;
  }

  let total = 0;
  for (const token of tokens) {
    const inName = scoreCatalogTokenInText(token, name);
    const inBrand = brand
      ? scoreCatalogTokenInText(token, brand) * 0.35
      : 0;
    const tokenScore = Math.max(inName, inBrand);
    if (tokenScore <= 0) {
      return 0;
    }
    total += tokenScore;
  }
  return total;
}

export function filterCatalogHits<
  T extends { name: string; brand: string | null },
>(rows: T[], tokens: string[]): T[] {
  if (tokens.length === 0) {
    return [];
  }

  return rows
    .filter((row) => {
      const haystack = catalogHaystack(row.name, row.brand);
      return tokens.every((token) => haystack.includes(token));
    })
    .sort((a, b) => compareCatalogFoodRows(a, b, tokens))
    .slice(0, CATALOG_SEARCH_LIMIT);
}

export function filterAndSortFoodsBySearch<
  T extends { name: string; brand: string | null; barcode?: string | null },
>(rows: T[], query: string): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return rows;
  }

  const ean = parseBarcodeEan(trimmed);
  if (ean) {
    return rows.filter((row) => row.barcode === ean);
  }

  const tokens = catalogSearchTokens(query);
  if (tokens) {
    const haystackMatch = (row: T) => {
      const haystack = catalogHaystack(row.name, row.brand);
      return tokens.every((token) => haystack.includes(token));
    };
    return rows
      .filter(haystackMatch)
      .sort((a, b) => compareCatalogFoodRows(a, b, tokens));
  }

  const needle = foldCatalogSearch(trimmed.toLowerCase());
  if (needle.length < CATALOG_SEARCH_MIN) {
    return rows;
  }

  const needleTokens = [needle];
  return rows
    .filter((row) => foodMatchesQuery(row.name, row.brand, query, row.barcode))
    .sort((a, b) => compareCatalogFoodRows(a, b, needleTokens));
}

function compareCatalogFoodRows<
  T extends { name: string; brand: string | null },
>(a: T, b: T, tokens: string[]): number {
  const scoreDiff =
    catalogFoodSearchScore(b.name, b.brand, tokens) -
    catalogFoodSearchScore(a.name, a.brand, tokens);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }
  return a.name.localeCompare(b.name, "ru");
}

function scoreCatalogTokenInText(token: string, text: string): number {
  const folded = foldCatalogSearch(text.trim().toLowerCase());
  if (!folded || !folded.includes(token)) {
    return 0;
  }

  const words = catalogMatchWords(text);
  let best = 0;

  if (folded.startsWith(token)) {
    best = Math.max(best, 8800);
  }

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const positionPenalty = index * 150;
    if (word === token) {
      best = Math.max(best, 10_000 - positionPenalty);
      continue;
    }
    if (word.startsWith(token)) {
      const tail = word.length - token.length;
      best = Math.max(best, 7200 - tail * 80 - positionPenalty);
      continue;
    }
    if (word.includes(token)) {
      best = Math.max(best, 1800 - positionPenalty);
    }
  }

  if (best === 0) {
    best = 1200;
  }
  return best;
}

function catalogMatchWords(text: string): string[] {
  const folded = foldCatalogSearch(text.trim().toLowerCase());
  if (!folded) {
    return [];
  }
  const cleaned = folded
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[%_,.()'"`\\*-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return [];
  }
  return cleaned.split(" ").filter((part) => part.length > 0);
}

function catalogHaystack(name: string, brand: string | null): string {
  return foldCatalogSearch(`${name} ${brand ?? ""}`.toLowerCase());
}

function catalogDedupeText(raw: string): string {
  let text = foldCatalogSearch(raw.toLowerCase());
  text = text.replace(/(\d),(\d)/g, "$1.$2");
  text = text.replace(/%/g, " ");
  text = text.replace(/-/g, " ");
  text = text.replace(/[%_,()'"`\\*]/g, " ");
  text = text.replace(/\./g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }

  const tokens: string[] = [];
  for (const part of text.split(" ")) {
    if (
      part.length === 0 ||
      CATALOG_SEARCH_STOP.has(part) ||
      tokens.includes(part)
    ) {
      continue;
    }
    tokens.push(part);
  }

  tokens.sort();
  return tokens.join(" ");
}

function catalogDedupeMacro(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0";
  }
  return String(Math.round(value * 10) / 10);
}

export function catalogDefaultPortion(packWeightG: number | null): {
  grams: number;
  label: string;
} {
  const grams =
    packWeightG != null &&
    packWeightG >= 5 &&
    packWeightG <= CATALOG_PACK_PORTION_MAX_G
      ? packWeightG
      : 100;
  return { grams, label: `${grams} г` };
}

/** Default portion when copying a catalog row into the user's food list. */
export function catalogCopyPortion(
  source: string | null,
  packWeightG: number | null,
): { grams: number; label: string } {
  if (
    source === CATALOG_SOURCE_CALORIZATOR &&
    packWeightG != null &&
    packWeightG > 0
  ) {
    const grams = Math.round(packWeightG * 100) / 100;
    return { grams, label: `${grams} г` };
  }
  return catalogDefaultPortion(packWeightG);
}

function catalogMacro(value: unknown): number {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

function catalogSourceId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return toNullableString(value);
}

function positiveGrams(value: unknown): number | null {
  const parsed = toNullableNumber(value);
  if (parsed == null || parsed <= 0) {
    return null;
  }

  return parsed;
}
