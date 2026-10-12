import { z } from "zod";

import {
  gatherAssistantTools,
  readAssistantProfile,
} from "@/lib/ai/assistant/tools";
import { ReviewError } from "@/lib/ai/errors";
import { generateGeminiJson, readGeminiKeys } from "@/lib/ai/gemini";
import { refundAiSlot, takeAiSlot } from "@/lib/ai/quota";
import { AI_REVIEW_NO_KEY } from "@/lib/messages";

const ASSISTANT_SYSTEM = `Ты помощник дневника питания и тренировок Yeah Buddy.
Отвечай кратко по-русски, только на основе переданных данных инструментов.
Не давай медицинских советов и не меняй программу тренировок.
Если данных не хватает — скажи, что записать в дневник.`;

const answerSchema = z.object({
  answer: z.string().trim().min(1).max(1200),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
  },
  required: ["answer"],
} as const;

export async function runAssistant(
  userId: string,
  message: string,
): Promise<{ answer: string; remaining: number | null }> {
  const trimmed = message.trim().slice(0, 500);
  if (trimmed.length < 2) {
    throw new ReviewError("EMPTY", "Напиши вопрос подробнее.");
  }

  const keys = readGeminiKeys("assistant");
  if (keys.length === 0) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const slot = await takeAiSlot(userId, "assistant");
  try {
    const [profile, tools] = await Promise.all([
      readAssistantProfile(userId),
      gatherAssistantTools(userId, trimmed),
    ]);

    const payload = await generateGeminiJson({
      keys,
      system: ASSISTANT_SYSTEM,
      parts: [
        { text: trimmed },
        {
          text: JSON.stringify({
            profile: profile
              ? { goal: profile.goal, goal_pace: profile.goal_pace }
              : null,
            tools,
          }),
        },
      ],
      schema: RESPONSE_SCHEMA,
      temperature: 0.4,
      timeoutMs: 25_000,
      maxOutputTokens: 1024,
      failedMessage: "Не получилось ответить. Попробуй позже.",
      limitMessage: "Лимит вопросов на сегодня.",
      purpose: "assistant",
    });

    const parsed = answerSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ReviewError(
        "GEMINI",
        "Не получилось ответить. Попробуй позже.",
      );
    }

    return {
      answer: parsed.data.answer,
      remaining: slot.remaining,
    };
  } catch (error) {
    await refundAiSlot(userId, "assistant");
    throw error;
  }
}
