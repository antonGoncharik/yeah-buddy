import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, readGeminiKeys } from "@/lib/ai/gemini";
import { compactPlateCatalog } from "@/lib/ai/plate-catalog";
import { takeReadyPlateItems } from "@/lib/ai/plate-match";
import { parsePlateModelItems } from "@/lib/ai/plate-parse";
import type { PlateDraft, PlateFoodRef } from "@/lib/ai/plate-types";
import { refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { FOOD_STATES } from "@/lib/foods";
import { AI_PLATE_FAILED, AI_PLATE_LIMIT, AI_PLATE_OFF } from "@/lib/messages";

const COOLDOWN_MS = 4_000;
const lastWrite = new Map<string, number>();

const CATALOG_LEGEND =
  "catalog: i индекс, n имя, s состояние (raw сырое, dry сухое, cooked готовое, as_is как есть, liquid жидкость), p/f/c белок/жир/углеводы на 100 г, y [сырое или сухое, готовое].";

const SYSTEM_PROMPT = `Ты смотришь на фото еды и раскладываешь тарелку на позиции. Каждая позиция — точный продукт из catalog либо одна порция, как её записал бы человек.

Сначала реши по каждому куску
- Куски явно разные и каждый узнаётся — отдельные позиции. Одно пятно в соусе, которое не разнять глазами — одна позиция, не рецепт.
- match=true только если это ТОТ ЖЕ продукт: вид, процент, часть туши и приготовление. 5% ≠ 9%, молоко ≠ кефир, грудка ≠ бедро. Сырой ≠ сухой ≠ варёный ≠ жареный. Фри ≠ варёный, пюре ≠ варёный. «Похоже» — не match. Тогда catalog_i и grams съедобного.
- В catalog y: [сырое или сухое, готовое] — match=true на эту сырую/сухую строку, grams готового, как на тарелке. Варёный дубль не заводи. state скопируй из s.
- Своё смешанное блюдо разбей на продукты catalog, только если куски явно они.
- Иначе match=false, catalog_i = -1. Ресторан, доставка, фри, соусное пятно, неуверенность — сюда. Не подбирай «похожий» продукт.

Имя, граммы, БЖУ
- name — как сказал бы вслух: «гречка с котлетой», «омлет», не «еда», «гарнир», «блюдо».
- grams — только съедобное. Кость, кожура, тарелка, приборы не входят. Тарелка около 24 см. Мясо с ладонь, не тонкое — около 120 г. Кулак готовой крупы — около 160 г. Плоский слой легче горки той же ширины. Яйцо без скорлупы около 55 г, ломтик хлеба около 30 г. Тонкая котлета на всю тарелку — не 400 г. Не уверен — середина правдоподобного, не верх. Кратность 5 г.
- protein, fat, carbs — всегда на СЪЕДЕННУЮ порцию, и при match=true тоже. Не на 100 г. Нет жира или углеводов — 0. Не пиши protein_per_100.
- Жир только видимый: сыр, майонез, желток, лосось, жареная корочка. Масло, которого не видно, не добавляй. Соль и воду не пиши.
- Порция должна быть правдоподобной. Готовая курица около 25–30 г белка на 100 г: больше 60 г белка — это крупный кусок мяса, не гарнир. Если число стыдно сказать вслух, граммы не те.
- state при match=false: cooked если готовое, liquid если напиток, as_is иначе. raw и dry — только если так и видно.
- Один продукт не пиши дважды: крупа и «гарнир», курица и блюдо, в котором она уже есть.

Когда пусто и чего не брать
- items: [] если съедобного нет: пустая посуда, стол, меню, чек, таблица КБЖУ, рука, закрытая упаковка. Еда в кадре есть — не оставляй пустым: match=false и порция.
- Не больше 8 позиций.
- Стакан молока, кефира, коктейля, сока — позиция, если его видно. Воду, чёрный кофе и чай без молока не пиши. Напиток, которого не видно, не пиши.`;

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
  const keys = readGeminiKeys("plate");
  if (keys.length === 0) {
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
      keys,
      system: SYSTEM_PROMPT,
      parts: [
        { inlineData: { mimeType: image.mimeType, data: image.data } },
        { text: CATALOG_LEGEND },
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
