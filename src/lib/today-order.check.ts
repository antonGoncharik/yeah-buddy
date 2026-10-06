import { parseTodayOrder } from "@/lib/today-order";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(parseTodayOrder(undefined), "meals", "missing stays meals");
assertEqual(parseTodayOrder("meals"), "meals", "meals");
assertEqual(parseTodayOrder("numbers"), "numbers", "numbers");
assertEqual(parseTodayOrder("custom"), "meals", "unknown stays meals");

console.log("today order ok");
