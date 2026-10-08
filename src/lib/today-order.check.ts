import { parseTodayOrder } from "@/lib/today-order";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(parseTodayOrder(undefined), "numbers", "missing stays numbers");
assertEqual(parseTodayOrder("meals"), "meals", "meals");
assertEqual(parseTodayOrder("numbers"), "numbers", "numbers");
assertEqual(parseTodayOrder("custom"), "numbers", "unknown stays numbers");

console.log("today order ok");
