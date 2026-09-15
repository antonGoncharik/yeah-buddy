import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

import {
  type CatalogDumpInput,
  parseCatalogDumpRow,
} from "@/lib/food/catalog-map";
import { upsertCatalogDump } from "@/lib/food/catalog-store";

const CHUNK = 500;

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error(
      "usage: tsx --env-file=.env.local scripts/import-catalog.ts <products.jsonl>",
    );
  }

  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  let read = 0;
  let skipped = 0;
  let written = 0;
  let chunk: CatalogDumpInput[] = [];

  async function flush() {
    const rows = chunk;
    chunk = [];
    if (rows.length === 0) {
      return;
    }
    written += await upsertCatalogDump(rows);
    console.log(`upserted ${written}`);
  }

  for await (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    read += 1;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      skipped += 1;
      continue;
    }
    const row = parseCatalogDumpRow(parsed);
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
