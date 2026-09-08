import { z } from "zod";

import { ReviewError } from "@/lib/ai/errors";
import type { ReviewBrief, ReviewText } from "@/lib/ai/types";
import { AI_REVIEW_FAILED, AI_REVIEW_NO_KEY } from "@/lib/messages";

const reviewTextSchema = z.object({
  headline: z.string().trim().min(1).max(180),
  observations: z.array(z.string().trim().min(1).max(400)).min(1).max(8),
  watch: z.array(z.string().trim().min(1).max(240)).max(5),
});

const SYSTEM_PROMPT = `Ты читаешь дневник питания и зала армрестлера. Это не медконсультация и не новая программа.

На вход уже посчитанные факты и сигналы. Не пересчитывай. Не выдумывай числа, продукты, упражнения, даты и фазы. Если чего-то нет во входе — не упоминай.

Пиши по-русски, коротко, как тренер в зале: прямо, без канцелярита и без мотивационных лозунгов. Не советуй БАДы, врачей, жёсткую диету. Не предлагай менять макроцикл, проценты или схему подходов.

headline — одна фраза про окно.
observations — 3–6 наблюдений. Свяжи еду и зал, если данные позволяют.
watch — 1–3 коротких пункта, на что смотреть дальше, без плана на неделю.

Если coverage = thin, не обобщай уверенно: данных мало.`;

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

const DEFAULT_MODEL = "gemini-2.5-flash";

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
            parts: [{ text: JSON.stringify(brief) }],
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
