import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, getGeminiApiKey } from "@/lib/ai/gemini";
import { compactPlateCatalog } from "@/lib/ai/plate-catalog";
import { resolvePlateItems } from "@/lib/ai/plate-match";
import { parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateDraft, PlateFoodRef } from "@/lib/ai/plate-types";
import { FOOD_STATES } from "@/lib/foods";
import { AI_PLATE_FAILED, AI_REVIEW_NO_KEY } from "@/lib/messages";

const COOLDOWN_MS = 4_000;
const lastWrite = new Map<string, number>();

const SYSTEM_PROMPT = `Ты смотришь на фото еды и сопоставляешь её со списком продуктов человека.

Правила
- Только то, что реально видно на тарелке или в посуде. Не додумывай масло, соль, воду, упаковку, столовые приборы.
- Смешанное блюдо разбей на отдельные продукты, если они различимы.
- Граммы — съедобная часть на тарелке, оценка на глаз.
- Если продукт есть в catalog, ставь его i в catalog_i. Смотри на имя и состояние: сырой ≠ сухой ≠ варёный.
- Если у продукта в catalog есть y: [сырое_или_сухое, готовое] — бери этот сырой/сухой продукт, граммы пиши готового (как на тарелке), не сырого. Не заводи варёный дубль.
- Нет в catalog — catalog_i = -1, укажи name, state, БЖУ на 100 г как обычно для такого продукта.
- Нет еды на фото — items: [].
- Не больше 8 позиций. Не пиши напитки, если их не видно.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          catalog_i: { type: "integer" },
          name: { type: "string" },
          grams: { type: "number" },
          state: { type: "string", enum: [...FOOD_STATES] },
          protein_per_100: { type: "number" },
          fat_per_100: { type: "number" },
          carbs_per_100: { type: "number" },
        },
        required: ["catalog_i", "name", "grams"],
      },
    },
  },
  required: ["items"],
} as const;

export async function analyzePlate(
  userId: string,
  catalogFoods: PlateFoodRef[],
  image: { mimeType: string; data: string },
  allFoods: PlateFoodRef[] = catalogFoods,
): Promise<PlateDraft> {
  if (!getGeminiApiKey()) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const now = Date.now();
  const previous = lastWrite.get(userId) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const catalog = compactPlateCatalog(catalogFoods);
  const payload = await generateGeminiJson({
    system: SYSTEM_PROMPT,
    parts: [
      { inlineData: { mimeType: image.mimeType, data: image.data } },
      { text: JSON.stringify({ catalog }) },
    ],
    schema: RESPONSE_SCHEMA,
    temperature: 0.1,
    timeoutMs: 35_000,
    failedMessage: AI_PLATE_FAILED,
  });

  const raw = parsePlateModelItems(payload);
  if (!raw) {
    throw new ReviewError("GEMINI", AI_PLATE_FAILED);
  }

  lastWrite.set(userId, Date.now());
  return { items: resolvePlateItems(raw, catalogFoods, allFoods) };
}
