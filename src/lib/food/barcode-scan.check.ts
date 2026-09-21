import { readScannedBarcode } from "@/lib/food/barcode-scan";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(readScannedBarcode("3017620422003"), "3017620422003", "ean-13");
assertEqual(readScannedBarcode(" 4600605021084 "), "4600605021084", "spaces");
assertEqual(readScannedBarcode("12345678"), "12345678", "ean-8");
assertEqual(readScannedBarcode("https://example.com"), null, "qr url");
assertEqual(readScannedBarcode("abc"), null, "letters");
assertEqual(readScannedBarcode("1234567"), null, "too short");

console.log("barcode scan parse ok");
