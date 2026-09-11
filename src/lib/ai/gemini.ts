import { z } from "zod";

import { ReviewError } from "@/lib/ai/errors";
import { reviewPromptPayload } from "@/lib/ai/prompt";
import type { ReviewBrief, ReviewText } from "@/lib/ai/types";
import { AI_REVIEW_FAILED, AI_REVIEW_NO_KEY } from "@/lib/messages";

const reviewTextSchema = z.object({
  headline: z.string().trim().min(1).max(180),
  observations: z.array(z.string().trim().min(1).max(400)).min(1).max(8),
  watch: z.array(z.string().trim().min(1).max(240)).max(5),
});

const SYSTEM_PROMPT = `Ты читаешь дневник: еда и зал. Не врач, не диетолог, не автор новой программы.

Как устроен дневник
- Еда: что съел. День бывает без зала или с залом — от этого цели.
- Зал: тренировки по кругу, не календарь пн/ср/пт. Сегодня одно, завтра следующее.
- Тренировка — шпаргалка. План уже на экране. Один раз «Готово», не галочки на каждый подход.
- Спорт любой. Не вешай ярлыки вроде армрестлинга или пауэрлифтинга, если их нет во входе.
- Цикл и этапы есть не у всех. Не предлагай их заводить, закрывать или менять проценты подходов.
- Вес тела — одна цифра на день, если есть. По нему видно рекомп: вес вниз при росте рабочих, белок на кг, сила к весу тела. Нет веса во входе — не выдумывай.
- nutrition.weight, maxes и signals уже посчитаны кодом: средние БЖУ, попадания, дельта веса, г/кг, план/факт, рабочие кг и сила к весу тела. Цитируй эти числа. Не пересчитывай и не округляй заново.
- nutrition и gym — за окно from…to. maxes.since = first_work: рабочие с первых записей, не только эти 14/30 дней.

Как писать
- По-русски, коротко, как сосед по залу. Без канцелярита, лозунгов и подбадриваний.
- Без «важно», «стоит отметить», «в целом», «рекомендуется», «следует», «можно рассмотреть».
- На вход уже факты и сигналы. Не пересчитывай. Не выдумывай числа, продукты, упражнения, даты и этапы. Нет во входе — не пиши.
- Дневных строк и подходов во входе нет специально. Опирайся на signals и сводки.
- Если coverage = thin: данных мало, так и скажи. Не делай вид, что видишь картину.
- Свяжи еду и зал, только если это видно по цифрам.
- Не советуй БАДы, врачей, жёсткую диету, меню на неделю, новые упражнения «для прогресса».
- Не предлагай отмечать подходы, вести календарь по дням недели или дробить «Готово».

Формат
headline — одна фраза про это окно.
observations — 3–6 конкретных наблюдений.
watch — 1–3 коротких пункта, на что смотреть дальше. Без плана на неделю.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    observations: {
      type: "array",
      items: { type: "string" },
    },
    watch: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["headline", "observations", "watch"],
} as const;

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model || DEFAULT_MODEL;
}

export async function writeReview(brief: ReviewBrief): Promise<ReviewText> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const model = encodeURIComponent(getGeminiModel());
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(reviewPromptPayload(brief)) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("gemini review failed", response.status, payload);
    throw new ReviewError("GEMINI", AI_REVIEW_FAILED);
  }

  const text = readCandidateText(payload);
  if (!text) {
    throw new ReviewError("GEMINI", AI_REVIEW_FAILED);
  }

  const parsed = reviewTextSchema.safeParse(readJson(text));
  if (!parsed.success) {
    throw new ReviewError("GEMINI", AI_REVIEW_FAILED);
  }

  return {
    headline: parsed.data.headline,
    observations: parsed.data.observations.slice(0, 6),
    watch: parsed.data.watch.slice(0, 3),
  };
}

function readCandidateText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    candidates?: Array<{
      finishReason?: unknown;
      content?: { parts?: Array<{ text?: unknown }> };
    }>;
  };
  const candidate = record.candidates?.[0];
  if (!candidate) {
    return null;
  }
  if (candidate.finishReason === "SAFETY") {
    return null;
  }

  const parts = candidate.content?.parts ?? [];
  const chunks = parts.flatMap((part) =>
    typeof part.text === "string" && part.text.trim() !== "" ? [part.text] : [],
  );
  if (chunks.length === 0) {
    return null;
  }

  return chunks.join("");
}

function readJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new ReviewError("GEMINI", AI_REVIEW_FAILED);
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
