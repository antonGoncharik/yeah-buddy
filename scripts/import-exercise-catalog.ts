import { readFile } from "node:fs/promises";

import { parseCatalogExerciseDumpRow } from "@/lib/workout/exercise-catalog-map";
import { upsertCatalogExerciseDump } from "@/lib/workout/exercise-catalog-store";
import { assertStarterCatalogMapComplete } from "@/lib/workout/starter-catalog-map";

const CHUNK = 200;

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error(
      "usage: tsx --env-file=.env.local scripts/import-exercise-catalog.ts <yeah-buddy-exercises.json>",
    );
  }

  assertStarterCatalogMapComplete();

  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("catalog json must be an array");
  }

  let read = 0;
  let skipped = 0;
  let written = 0;
  let chunk: ReturnType<typeof parseCatalogExerciseDumpRow>[] = [];

  async function flush() {
    const rows = chunk.filter(
      (row): row is NonNullable<typeof row> => row != null,
    );
    chunk = [];
    if (rows.length === 0) {
      return;
    }
    written += await upsertCatalogExerciseDump(rows);
    console.log(`upserted ${written}`);
  }

  for (const item of parsed) {
    read += 1;
    const row = parseCatalogExerciseDumpRow(item);
    if (!row) {
      skipped += 1;
      continue;
    }
    chunk.push(row);
    if (chunk.length >= CHUNK) {
      await flush();
    }
  }

  await flush();
  console.log(`read ${read}, skipped ${skipped}, upserted ${written}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
