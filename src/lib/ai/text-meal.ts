import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, readGeminiKeys } from "@/lib/ai/gemini";
import {
  MEAL_LOG_CATALOG_LEGEND,
  MEAL_LOG_SYSTEM_PROMPT,
} from "@/lib/ai/meal-log-prompt";
import { PLATE_RESPONSE_SCHEMA } from "@/lib/ai/plate";
import { compactPlateCatalog } from "@/lib/ai/plate-catalog";
import { takeReadyPlateItems } from "@/lib/ai/plate-match";
import { parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateDraft, PlateFoodRef } from "@/lib/ai/plate-types";
import { refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { normalizeMealLogText } from "@/lib/ai/text-meal-input";
import {
  AI_TEXT_MEAL_FAILED,
  AI_TEXT_MEAL_LIMIT,
  AI_TEXT_MEAL_OFF,
} from "@/lib/messages";

const COOLDOWN_MS = 2_000;
const lastWrite = new Map<string, number>();

export { normalizeMealLogText } from "@/lib/ai/text-meal-input";

export async function analyzeTextMeal(
  userId: string,
  catalogFoods: PlateFoodRef[],
  text: string,
  allFoods: PlateFoodRef[] = catalogFoods,
): Promise<PlateDraft & { remaining: number | null }> {
  const keys = readGeminiKeys("text");
  if (keys.length === 0) {
    throw new ReviewError("NO_KEY", AI_TEXT_MEAL_OFF);
  }

  const normalized = normalizeMealLogText(text);
  if (!normalized) {
    throw new ReviewError("GEMINI", AI_TEXT_MEAL_FAILED);
  }

  const now = Date.now();
  const previous = lastWrite.get(userId) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const slot = await takeAiSlot(userId, "text");
  try {
    const catalog = compactPlateCatalog(catalogFoods);
    const payload = await generateGeminiJson({
      keys,
      system: MEAL_LOG_SYSTEM_PROMPT,
      parts: [
        { text: normalized },
        { text: MEAL_LOG_CATALOG_LEGEND },
        { text: JSON.stringify({ catalog }) },
      ],
      schema: PLATE_RESPONSE_SCHEMA,
      timeoutMs: 35_000,
      maxOutputTokens: 4_096,
      failedMessage: AI_TEXT_MEAL_FAILED,
      limitMessage: AI_TEXT_MEAL_LIMIT,
      thinkingLevel: "minimal",
    });

    const raw = parsePlateModelItems(payload);
    if (!raw) {
      throw new ReviewError("GEMINI", AI_TEXT_MEAL_FAILED);
    }

    const items = takeReadyPlateItems(raw, catalogFoods, allFoods);
    if (!items) {
      throw new ReviewError("GEMINI", AI_TEXT_MEAL_FAILED);
    }

    lastWrite.set(userId, Date.now());
    return { items, remaining: slot.remaining };
  } catch (error) {
    await refundAiSlot(userId, "text");
    throw error;
  }
}
