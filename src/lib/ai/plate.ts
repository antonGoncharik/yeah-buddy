import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, getGeminiPlateApiKey } from "@/lib/ai/gemini";
import { compactPlateCatalog } from "@/lib/ai/plate-catalog";
import { takeReadyPlateItems } from "@/lib/ai/plate-match";
import { parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateDraft, PlateFoodRef } from "@/lib/ai/plate-types";
import { refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { FOOD_STATES } from "@/lib/foods";
import { AI_PLATE_FAILED, AI_PLATE_LIMIT, AI_PLATE_OFF } from "@/lib/messages";

const COOLDOWN_MS = 4_000;
const lastWrite = new Map<string, number>();

const SYSTEM_PROMPT = `Ты смотришь на фото еды. Каждая позиция — либо точный продукт из catalog, либо быстрая запись порции.

Правила
- Только то, что реально видно на тарелке или в посуде. Не додумывай масло, соль, воду, упаковку, столовые приборы.
- match=true только если это ТОТ ЖЕ продукт из catalog: тот же вид и приготовление. Тогда catalog_i и grams съедобного на глаз. Сырой ≠ сухой ≠ варёный ≠ жареный. Картофель фри ≠ варёный, пюре ≠ варёный. «Похоже на картошку» — не match.
- Если у продукта в catalog есть y: [сырое_или_сухое, готовое] — при match=true бери этот сырой/сухой продукт, граммы пиши готового (как на тарелке). Не заводи варёный дубль.
- Смешанное блюдо из СВОИХ продуктов разбей на них, только если куски явно те продукты из catalog.
- match=false если нет точного совпадения, ресторан/кафе/доставка, фри, смешанное одним пятном, не уверен: catalog_i = -1, name как на тарелке, protein/fat/carbs СЪЕДЕННОЙ порции, не на 100 г. Нет жира или углеводов — пиши 0. Не подбирай «похожий» продукт. Не дроби на выдуманные ингредиенты. Не пиши protein_per_100.
- items: [] только если съедобного не видно: пустая посуда, стол, меню, рука, упаковка. Еда на фото есть — не оставляй пустым, даже если не уверен: match=false и порция.
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
          match: { type: "boolean" },
          name: { type: "string" },
          grams: { type: "number" },
          state: { type: "string", enum: [...FOOD_STATES] },
          protein: { type: "number" },
          fat: { type: "number" },
          carbs: { type: "number" },
          protein_per_100: { type: "number" },
          fat_per_100: { type: "number" },
          carbs_per_100: { type: "number" },
        },
        required: [
          "catalog_i",
          "match",
          "name",
          "grams",
          "protein",
          "fat",
          "carbs",
        ],
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
): Promise<PlateDraft & { remaining: number | null }> {
  const key = getGeminiPlateApiKey();
  if (!key) {
    throw new ReviewError("NO_KEY", AI_PLATE_OFF);
  }

  const now = Date.now();
  const previous = lastWrite.get(userId) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    throw new ReviewError("BUSY", "Подожди немного и нажми ещё раз.");
  }

  const slot = await takeAiSlot(userId, "plate");
  try {
    const catalog = compactPlateCatalog(catalogFoods);
    const payload = await generateGeminiJson({
      key,
      system: SYSTEM_PROMPT,
      parts: [
        { inlineData: { mimeType: image.mimeType, data: image.data } },
        { text: JSON.stringify({ catalog }) },
      ],
      schema: RESPONSE_SCHEMA,
      timeoutMs: 35_000,
      maxOutputTokens: 4_096,
      failedMessage: AI_PLATE_FAILED,
      limitMessage: AI_PLATE_LIMIT,
      thinkingLevel: "minimal",
    });

    const raw = parsePlateModelItems(payload);
    if (!raw) {
      throw new ReviewError("GEMINI", AI_PLATE_FAILED);
    }

    const items = takeReadyPlateItems(raw, catalogFoods, allFoods);
    if (!items) {
      throw new ReviewError("GEMINI", AI_PLATE_FAILED);
    }

    lastWrite.set(userId, Date.now());
    return { items, remaining: slot.remaining };
  } catch (error) {
    await refundAiSlot(userId, "plate");
    throw error;
  }
}
