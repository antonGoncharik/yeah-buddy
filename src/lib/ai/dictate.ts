import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, readGeminiKeys } from "@/lib/ai/gemini";
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

const CATALOG_LEGEND =
  "catalog: i индекс, n имя, s состояние (raw сырое, dry сухое, cooked готовое, as_is как есть, liquid жидкость), p/f/c белок/жир/углеводы на 100 г, y [сырое или сухое, готовое].";

const SYSTEM_PROMPT = `Ты слышишь, как человек называет еду для дневника, и раскладываешь сказанное на позиции. Каждая позиция — точный продукт из catalog либо одна порция, как её записал бы человек.

Сначала реши по каждому названному продукту
- Что названо отдельно — отдельные позиции. Один и тот же продукт дважды — одна позиция, граммы сложи.
- match=true только если это ТОТ ЖЕ продукт: вид, процент, часть туши и приготовление. 5% ≠ 9%, молоко ≠ кефир, грудка ≠ бедро. Сырой ≠ сухой ≠ варёный ≠ жареный. Фри ≠ варёный, пюре ≠ варёный. «Похоже» — не match. Тогда catalog_i и grams.
- В catalog y: [сырое или сухое, готовое]. match=true на эту сырую/сухую строку. grams — всегда готового веса. Сказал сухой или сырой вес — готовое = названное * y[1] / y[0]. Сказал готовое или не уточнил — grams как назвал. Варёный дубль не заводи. state скопируй из s.
- Иначе match=false, catalog_i = -1. Не подбирай похожий продукт.

Граммы, имя, БЖУ
- Бери число из речи: «сто грамм» = 100, «полкило» = 500, «две по 80» = 160. Не сказал число: яйцо без скорлупы 55, столовая ложка масла 10, чайная ложка 5, котлета 80, кулак готовой крупы 160, стакан напитка 200. Кратность 5 г, кроме яйца и ложки.
- name — как сказал бы вслух: «гречка сухая», «котлета из индейки», не «еда» и не «гарнир».
- protein, fat, carbs — всегда на СЪЕДЕННУЮ порцию, и при match=true тоже. Не на 100 г. Нет жира или углеводов — 0.
- Не добавляй то, чего не было в речи. Соль и воду не пиши.
- state при match=false: cooked если готовое, liquid если напиток, dry если сказал «сухой» или «сухая», raw если сказал «сырой», as_is иначе.

Когда пусто
- items: [] если еды не назвал. Назвал — не оставляй пустым: match=false и порция.
- Не больше 8 позиций.`;

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
      system: SYSTEM_PROMPT,
      parts: [
        { inlineData: { mimeType: audio.mimeType, data: audio.data } },
        { text: "Разложи сказанное на позиции." },
        { text: CATALOG_LEGEND },
        { text: JSON.stringify({ catalog }) },
      ],
      schema: PLATE_RESPONSE_SCHEMA,
      timeoutMs: 35_000,
      maxOutputTokens: 4_096,
      failedMessage: AI_DICTATE_FAILED,
      limitMessage: AI_DICTATE_LIMIT,
      thinkingLevel: "minimal",
    });

    const raw = parsePlateModelItems(payload);
    if (!raw) {
      throw new ReviewError("GEMINI", AI_DICTATE_FAILED);
    }

    const items = takeReadyPlateItems(raw, catalogFoods, allFoods);
    if (!items) {
      throw new ReviewError("GEMINI", AI_DICTATE_FAILED);
    }

    lastWrite.set(userId, Date.now());
    return { items, remaining: slot.remaining };
  } catch (error) {
    await refundAiSlot(userId, "dictate");
    throw error;
  }
}
