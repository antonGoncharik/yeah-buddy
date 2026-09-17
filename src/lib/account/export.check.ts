import { accountExportFilename } from "@/lib/account/export-shape";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  accountExportFilename("2026-09-17T20:00:00.000Z"),
  "yeah-buddy-2026-09-17.json",
  "iso timestamp",
);
assertEqual(accountExportFilename("nope"), "yeah-buddy.json", "fallback");

console.log("account export ok");
