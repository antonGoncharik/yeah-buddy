import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function collect(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(path)));
    } else if (entry.name.endsWith(".check.ts")) {
      files.push(path);
    }
  }
  return files;
}

async function main() {
  const files = (await collect("src")).sort();
  if (files.length === 0) {
    throw new Error("no *.check.ts files");
  }

  for (const file of files) {
    await import(pathToFileURL(join(process.cwd(), file)).href);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
