import { isGeminiLimit, readGeminiKey } from "@/lib/ai/gemini";
import {
  dailyLimit,
  plateRemainingLine,
  remainingAfterUse,
} from "@/lib/ai/quota-copy";
import { AI_PLATE_QUOTA } from "@/lib/messages";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(
  readGeminiKey("review", { GEMINI_API_KEY: " wow " }),
  "wow",
  "review key trims",
);
assertEqual(
  readGeminiKey("plate", { GEMINI_API_KEY: "wow" }),
  null,
  "plate does not share review key",
);
assertEqual(
  readGeminiKey("plate", {
    GEMINI_API_KEY: "wow",
    GEMINI_PLATE_API_KEY: "pic",
  }),
  "pic",
  "plate key is separate",
);
assertEqual(
  readGeminiKey("review", { GEMINI_PLATE_API_KEY: "pic" }),
  null,
  "review does not share plate key",
);

assertEqual(dailyLimit("plate"), 5, "five photos");
assertEqual(dailyLimit("review"), 2, "two reviews");

assertEqual(remainingAfterUse(0, 5), 5, "full remaining");
assertEqual(remainingAfterUse(5, 5), 0, "exhausted");
assertEqual(remainingAfterUse(6, 5), 0, "clamp over");

assertEqual(plateRemainingLine(null), null, "no line when untracked");
assertEqual(plateRemainingLine(0), AI_PLATE_QUOTA, "exhausted copy");
assertEqual(plateRemainingLine(1), "Ещё одно фото сегодня.", "one left");
assertEqual(plateRemainingLine(5), "Ещё 5 фото сегодня.", "several left");

assertEqual(isGeminiLimit(429, null), true, "http 429 is limit");
assertEqual(
  isGeminiLimit(200, { error: { status: "RESOURCE_EXHAUSTED" } }),
  true,
  "resource exhausted payload",
);
assertEqual(
  isGeminiLimit(502, { error: { status: "INTERNAL" } }),
  false,
  "other error",
);

console.log("ai quota keys ok");
