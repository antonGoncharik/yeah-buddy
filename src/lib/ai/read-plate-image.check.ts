import { fitPlateCaptureSize } from "@/lib/ai/read-plate-image";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const scaled = fitPlateCaptureSize(3200, 2400);
assertEqual(scaled.width, 1600, "scale width");
assertEqual(scaled.height, 1200, "scale height");

const small = fitPlateCaptureSize(800, 600);
assertEqual(small.width, 800, "keep small width");
assertEqual(small.height, 600, "keep small height");

const wide = fitPlateCaptureSize(2000, 1000);
assertEqual(wide.width, 1600, "wide width");
assertEqual(wide.height, 800, "wide height");

console.log("read plate image ok");
