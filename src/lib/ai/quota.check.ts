import {
  availableGeminiKeys,
  geminiCooldownUntil,
  isGeminiLimit,
  noteGeminiLimited,
  readGeminiKey,
  readGeminiKeys,
} from "@/lib/ai/gemini";
import {
  dailyLimit,
  dictateRemainingLine,
  plateRemainingLine,
  remainingAfterUse,
  textMealRemainingLine,
} from "@/lib/ai/quota-copy";
import { AI_DICTATE_QUOTA, AI_PLATE_QUOTA } from "@/lib/messages";

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
assertEqual(
  readGeminiKeys("review", {
    GEMINI_API_KEY: " a, b , a , c , d ",
  }).join("|"),
  "a|b|c|d",
  "review pool keeps all distinct keys",
);
assertEqual(
  readGeminiKey("text", { GEMINI_TEXT_API_KEY: " line " }),
  "line",
  "text key trims",
);
assertEqual(
  readGeminiKeys("text", { GEMINI_DICTATE_API_KEY: "say" }).join("|"),
  "",
  "text pool is separate",
);
assertEqual(
  readGeminiKeys("plate", { GEMINI_PLATE_API_KEY: " , pic , " }).join("|"),
  "pic",
  "plate pool skips blanks",
);
assertEqual(
  readGeminiKeys("plate", { GEMINI_API_KEY: "wow,two" }).join("|"),
  "",
  "plate pool ignores review keys",
);
assertEqual(
  readGeminiKey("dictate", {
    GEMINI_API_KEY: "wow",
    GEMINI_PLATE_API_KEY: "pic",
  }),
  null,
  "dictate does not share other keys",
);
assertEqual(
  readGeminiKey("dictate", { GEMINI_DICTATE_API_KEY: " say " }),
  "say",
  "dictate key trims",
);
assertEqual(
  readGeminiKeys("dictate", { GEMINI_DICTATE_API_KEY: " a, b , a " }).join("|"),
  "a|b",
  "dictate pool keeps distinct keys",
);
assertEqual(
  readGeminiKey("plate", { GEMINI_DICTATE_API_KEY: "say" }),
  null,
  "plate does not share dictate key",
);

const cooled = new Map<string, number>();
noteGeminiLimited("a", 1_000, cooled);
noteGeminiLimited("a", 500, cooled);
assertEqual(cooled.get("a"), 1_000, "cooldown does not shrink");
assertEqual(
  availableGeminiKeys(["a", "b"], 500, cooled).join("|"),
  "b",
  "cooling key is skipped",
);
assertEqual(
  availableGeminiKeys(["a", "b"], 1_000, cooled).join("|"),
  "a|b",
  "expired cooldown returns",
);

const now = Date.UTC(2026, 8, 23, 12, 0, 0);
assertEqual(
  geminiCooldownUntil(
    { error: { quotaId: "GenerateRequestsPerMinutePerProjectPerModel" } },
    now,
  ) - now,
  60_000,
  "minute quota waits a minute",
);
assertEqual(
  geminiCooldownUntil({ error: { details: [{ retryDelay: "30s" }] } }, now) -
    now,
  30_000,
  "retry delay is honored",
);
const dailyWait =
  geminiCooldownUntil(
    {
      error: {
        quotaId: "GenerateRequestsPerDayPerProjectPerModel",
        details: [{ retryDelay: "30s" }],
      },
    },
    now,
  ) - now;
if (dailyWait <= 60_000 || dailyWait > 86_400_000) {
  throw new Error(`daily quota wait out of range: ${dailyWait}`);
}
assertEqual(
  geminiCooldownUntil({ error: { status: "RESOURCE_EXHAUSTED" } }, now) - now,
  15 * 60_000,
  "unknown limit waits fifteen minutes",
);

assertEqual(dailyLimit("plate"), 3, "three photos");
assertEqual(dailyLimit("review"), 3, "three reviews");
assertEqual(dailyLimit("dictate"), 3, "three spoken logs");
assertEqual(dailyLimit("text"), 3, "three text meal logs");

assertEqual(remainingAfterUse(0, 5), 5, "full remaining");
assertEqual(remainingAfterUse(5, 5), 0, "exhausted");
assertEqual(remainingAfterUse(6, 5), 0, "clamp over");

assertEqual(plateRemainingLine(null), null, "no line when untracked");
assertEqual(plateRemainingLine(0), AI_PLATE_QUOTA, "exhausted copy");
assertEqual(plateRemainingLine(1), "Ещё одно фото сегодня.", "one left");
assertEqual(plateRemainingLine(2), "Ещё 2 фото сегодня.", "two left");
assertEqual(plateRemainingLine(3), "Ещё 3 фото сегодня.", "three left");

assertEqual(dictateRemainingLine(null), null, "dictate untracked");
assertEqual(dictateRemainingLine(0), AI_DICTATE_QUOTA, "dictate exhausted");
assertEqual(
  dictateRemainingLine(1),
  "Ещё одна запись сегодня.",
  "dictate one left",
);
assertEqual(
  dictateRemainingLine(2),
  "Ещё 2 записи сегодня.",
  "dictate few left",
);
assertEqual(
  dictateRemainingLine(3),
  "Ещё 3 записи сегодня.",
  "dictate three left",
);
assertEqual(
  dictateRemainingLine(5),
  "Ещё 5 записей сегодня.",
  "dictate many left",
);
assertEqual(
  dictateRemainingLine(21),
  "Ещё 21 запись сегодня.",
  "dictate 21 left",
);

assertEqual(textMealRemainingLine(null), null, "text untracked");
assertEqual(
  textMealRemainingLine(3),
  "Ещё 3 строки сегодня.",
  "text three left",
);

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
