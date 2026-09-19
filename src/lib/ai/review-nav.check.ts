import { reviewBackHref, reviewHref } from "@/lib/ai/review-nav";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(reviewHref(), "/progress", "bare href");
assertEqual(reviewHref("food"), "/progress?from=food", "from food");
assertEqual(reviewBackHref("food"), "/today/history", "back food");
assertEqual(reviewBackHref("gym"), "/workouts/history", "back gym");
assertEqual(reviewBackHref("workouts"), "/workouts", "back workouts");
assertEqual(reviewBackHref("today"), "/today", "back today");
assertEqual(reviewBackHref("week"), "/today/week", "back week");
assertEqual(reviewBackHref("settings"), "/settings", "back settings");
assertEqual(reviewBackHref(null), "/today", "back default");

console.log("review nav ok");
