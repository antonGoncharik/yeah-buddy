import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, readGeminiKeys } from "@/lib/ai/gemini";
import {
  MEAL_LOG_CATALOG_LEGEND,
  MEAL_LOG_SYSTEM_PROMPT,
} from "@/lib/ai/meal-log-prompt";
import { requireMealParseItems } from "@/lib/ai/meal-parse-guard";
import { PLATE_RESPONSE_SCHEMA } from "@/lib/ai/plate";
import { compactPlateCatalog } from "@/lib/ai/plate-catalog";
import { takeReadyPlateItems } from "@/lib/ai/plate-match";
import { parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateDraft, PlateFoodRef } from "@/lib/ai/plate-types";
import { refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import {
  AI_DICTATE_FAILED,
  AI_DICTATE_LIMIT,
  AI_DICTATE_OFF,
} from "@/lib/messages";

const COOLDOWN_MS = 4_000;
const lastWrite = new Map<string, number>();

export async function analyzeDictate(
  userId: string,
  catalogFoods: PlateFoodRef[],
  audio: { mimeType: string; data: string },
  allFoods: PlateFoodRef[] = catalogFoods,
): Promise<PlateDraft & { remaining: number | null }> {
  const keys = readGeminiKeys("dictate");
  if (keys.length === 0) {
    throw new ReviewError("NO_KEY", AI_DICTATE_OFF);
  }

  const now = Date.now();
  const previous = lastWrite.get(userId) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const slot = await takeAiSlot(userId, "dictate");
  try {
    const catalog = compactPlateCatalog(catalogFoods);
    const payload = await generateGeminiJson({
      keys,
      system: MEAL_LOG_SYSTEM_PROMPT,
      parts: [
        { inlineData: { mimeType: audio.mimeType, data: audio.data } },
        { text: "Разложи сказанное на позиции." },
        { text: MEAL_LOG_CATALOG_LEGEND },
        { text: JSON.stringify({ catalog }) },
      ],
      schema: PLATE_RESPONSE_SCHEMA,
      timeoutMs: 35_000,
      maxOutputTokens: 4_096,
      failedMessage: AI_DICTATE_FAILED,
      limitMessage: AI_DICTATE_LIMIT,
      thinkingLevel: "minimal",
      purpose: "dictate",
    });

    const raw = parsePlateModelItems(payload);
    const matched = takeReadyPlateItems(raw ?? [], catalogFoods, allFoods);
    const items = requireMealParseItems(raw, matched ?? [], AI_DICTATE_FAILED);

    lastWrite.set(userId, Date.now());
    return { items, remaining: slot.remaining };
  } catch (error) {
    await refundAiSlot(userId, "dictate");
    throw error;
  }
}
