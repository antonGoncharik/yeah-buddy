import { CatalogFoodNotFoundError } from "@/lib/food/catalog-errors";
import {
  CATALOG_SEARCH_FETCH,
  CATALOG_SEARCH_LIMIT,
  type CatalogDumpInput,
  type CatalogFood,
  catalogDefaultPortion,
  catalogSearchLead,
  catalogSearchTokens,
  filterCatalogHits,
  mapCatalogFood,
  parseBarcodeEan,
} from "@/lib/food/catalog-map";
import {
  catalogOffUserAgent,
  parseOpenFoodFactsProduct,
} from "@/lib/food/catalog-off";
import { mapFood } from "@/lib/food/map";
import { calcKcalFromMacros } from "@/lib/nutrition";
import { UNIQUE_VIOLATION } from "@/lib/seed-missing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";

export { CatalogFoodNotFoundError };

const CATALOG_FOOD_COLUMNS =
  "id, name, brand, pack_weight_g, protein_per_100, fat_per_100, carbs_per_100, kcal_per_100";

const OFF_PRODUCT_FIELDS = [
  "product_name",
  "product_name_ru",
  "generic_name",
  "generic_name_ru",
  "brands",
  "nutriments",
  "product_quantity",
  "product_quantity_unit",
  "quantity",
].join(",");

export async function searchCatalogFoods(
  userId: string,
  query: string,
): Promise<CatalogFood[]> {
  if (parseBarcodeEan(query)) {
    return [];
  }

  const tokens = catalogSearchTokens(query);
  if (!tokens) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const owned = await supabase
    .from("foods")
    .select("catalog_food_id")
    .eq("user_id", userId)
    .not("catalog_food_id", "is", null);

  if (owned.error) {
    throw owned.error;
  }

  const ownedIds = (owned.data ?? [])
    .map((row) => row.catalog_food_id)
    .filter((id): id is string => typeof id === "string");

  const lead = catalogSearchLead(tokens);
  const pattern = `%${lead}%`;
  const fetchLimit =
    tokens.length > 1 ? CATALOG_SEARCH_FETCH : CATALOG_SEARCH_LIMIT;
  let request = supabase
    .from("catalog_foods")
    .select(CATALOG_FOOD_COLUMNS)
    .or(`name.ilike."${pattern}",brand.ilike."${pattern}"`)
    .order("name", { ascending: true })
    .limit(fetchLimit);

  if (ownedIds.length > 0) {
    request = request.not("id", "in", `(${ownedIds.join(",")})`);
  }

  const result = await request;
  if (result.error) {
    throw result.error;
  }

  return filterCatalogHits(
    (result.data ?? []).map((row) =>
      mapCatalogFood(row as Record<string, unknown>),
    ),
    tokens,
  );
}

export async function copyCatalogFood(
  userId: string,
  catalogFoodId: string,
): Promise<Food> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      catalogFoodId,
    )
  ) {
    throw new CatalogFoodNotFoundError();
  }

  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("foods")
    .select("*")
    .eq("user_id", userId)
    .eq("catalog_food_id", catalogFoodId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return mapFood(existing.data as Record<string, unknown>);
  }

  const catalog = await supabase
    .from("catalog_foods")
    .select("*")
    .eq("id", catalogFoodId)
    .maybeSingle();

  if (catalog.error) {
    throw catalog.error;
  }

  if (!catalog.data) {
    throw new CatalogFoodNotFoundError();
  }

  const item = mapCatalogFood(catalog.data as Record<string, unknown>);
  const portion = catalogDefaultPortion(item.pack_weight_g);
  const inserted = await supabase
    .from("foods")
    .insert({
      user_id: userId,
      catalog_food_id: catalogFoodId,
      name: item.name,
      brand: item.brand,
      state: "as_is",
      protein_per_100: item.protein_per_100,
      fat_per_100: item.fat_per_100,
      carbs_per_100: item.carbs_per_100,
      kcal_per_100: calcKcalFromMacros(
        item.protein_per_100,
        item.fat_per_100,
        item.carbs_per_100,
      ),
      default_portion_g: portion.grams,
      default_portion_label: portion.label,
    })
    .select("*")
    .single();

  if (inserted.error) {
    if (inserted.error.code === UNIQUE_VIOLATION) {
      const raced = await supabase
        .from("foods")
        .select("*")
        .eq("user_id", userId)
        .eq("catalog_food_id", catalogFoodId)
        .single();

      if (raced.error || !raced.data) {
        throw raced.error ?? inserted.error;
      }

      return mapFood(raced.data as Record<string, unknown>);
    }

    throw inserted.error;
  }

  return mapFood(inserted.data as Record<string, unknown>);
}

export async function upsertCatalogDump(
  rows: CatalogDumpInput[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = createSupabaseServerClient();
  const written = await supabase.from("catalog_foods").upsert(rows, {
    onConflict: "source,source_product_id",
  });

  if (written.error) {
    throw written.error;
  }

  return rows.length;
}

export async function lookupCatalogBarcode(ean: string): Promise<CatalogFood> {
  const code = parseBarcodeEan(ean);
  if (!code) {
    throw new CatalogFoodNotFoundError();
  }

  const cached = await readCatalogByBarcode(code);
  if (cached) {
    return cached;
  }

  const off = await fetchOpenFoodFactsProduct(code);
  if (!off) {
    // Пустая пачка в общий каталог не пишется — её заводят в личный список.
    throw new CatalogFoodNotFoundError();
  }

  return upsertOffCatalog(off);
}

async function readCatalogByBarcode(ean: string): Promise<CatalogFood | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("catalog_foods")
    .select(CATALOG_FOOD_COLUMNS)
    .eq("barcode", ean)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapCatalogFood(result.data as Record<string, unknown>);
}

async function fetchOpenFoodFactsProduct(
  ean: string,
): Promise<CatalogDumpInput | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=${OFF_PRODUCT_FIELDS}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": catalogOffUserAgent(),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`openfoodfacts ${response.status}`);
  }

  return parseOpenFoodFactsProduct(ean, await response.json());
}

async function upsertOffCatalog(row: CatalogDumpInput): Promise<CatalogFood> {
  const supabase = createSupabaseServerClient();
  const written = await supabase
    .from("catalog_foods")
    .upsert(row, { onConflict: "source,source_product_id" })
    .select(CATALOG_FOOD_COLUMNS)
    .single();

  if (written.error) {
    if (written.error.code === UNIQUE_VIOLATION) {
      const raced = await readCatalogByBarcode(row.source_product_id);
      if (!raced) {
        throw written.error;
      }
      return raced;
    }

    throw written.error;
  }

  return mapCatalogFood(written.data as Record<string, unknown>);
}
