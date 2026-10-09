import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EXERCISE_CATALOG_SOURCE } from "@/lib/workout/exercise-catalog-constants";
import { CatalogExerciseNotFoundError } from "@/lib/workout/exercise-catalog-errors";
import {
  type CatalogExerciseDetail,
  type CatalogExerciseDumpRow,
  type CatalogExerciseSummary,
  catalogExerciseListColumns,
  catalogExerciseSearchFetchLimit,
  catalogExerciseSearchPattern,
  catalogExerciseSearchTokens,
  filterCatalogExerciseHits,
  mapCatalogExerciseDetail,
  mapCatalogExerciseSummary,
} from "@/lib/workout/exercise-catalog-map";
import { starterNameRuForSourceId } from "@/lib/workout/starter-catalog-map";

export { CatalogExerciseNotFoundError };

const DETAIL_COLUMNS =
  "id, source_exercise_id, name_en, name_ru, equipment, body_part, gif_path, image_path, instruction_steps";

export async function searchCatalogExercises(
  query: string,
): Promise<CatalogExerciseSummary[]> {
  const tokens = catalogExerciseSearchTokens(query);
  if (!tokens) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const pattern = catalogExerciseSearchPattern(tokens);
  const fetchLimit = catalogExerciseSearchFetchLimit(tokens.length);
  const result = await supabase
    .from("catalog_exercises")
    .select(catalogExerciseListColumns())
    .or(
      `name_en.ilike."${pattern}",name_ru.ilike."${pattern}",equipment.ilike."${pattern}"`,
    )
    .order("name_en", { ascending: true })
    .limit(fetchLimit);

  if (result.error) {
    throw result.error;
  }

  return filterCatalogExerciseHits(
    (result.data ?? []).map((row) =>
      mapCatalogExerciseSummary(row as unknown as Record<string, unknown>),
    ),
    tokens,
  );
}

export async function getCatalogExercise(
  catalogExerciseId: string,
): Promise<CatalogExerciseDetail | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      catalogExerciseId,
    )
  ) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("catalog_exercises")
    .select(DETAIL_COLUMNS)
    .eq("id", catalogExerciseId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapCatalogExerciseDetail(
    result.data as unknown as Record<string, unknown>,
  );
}

export async function getCatalogExerciseBySourceId(
  sourceExerciseId: string,
): Promise<CatalogExerciseSummary | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("catalog_exercises")
    .select(catalogExerciseListColumns())
    .eq("source", EXERCISE_CATALOG_SOURCE)
    .eq("source_exercise_id", sourceExerciseId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapCatalogExerciseSummary(
    result.data as unknown as Record<string, unknown>,
  );
}

export async function upsertCatalogExerciseDump(
  rows: CatalogExerciseDumpRow[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = createSupabaseServerClient();
  const payload = rows.map((row) => ({
    source: EXERCISE_CATALOG_SOURCE,
    source_exercise_id: row.id,
    name_en: row.name,
    name_ru: starterNameRuForSourceId(row.id),
    equipment: row.equipment,
    body_part: row.body_part,
    gif_path: row.gif_url,
    image_path: row.image,
    instruction_steps: row.instruction_steps,
  }));

  const written = await supabase.from("catalog_exercises").upsert(payload, {
    onConflict: "source,source_exercise_id",
  });

  if (written.error) {
    throw written.error;
  }

  return rows.length;
}

export async function linkExerciseCatalog(
  userId: string,
  exerciseId: string,
  catalogExerciseId: string | null,
): Promise<void> {
  if (catalogExerciseId != null) {
    const catalog = await getCatalogExercise(catalogExerciseId);
    if (!catalog) {
      throw new CatalogExerciseNotFoundError();
    }
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("exercises")
    .update({ catalog_exercise_id: catalogExerciseId })
    .eq("user_id", userId)
    .eq("id", exerciseId);

  if (updated.error) {
    throw updated.error;
  }
}
