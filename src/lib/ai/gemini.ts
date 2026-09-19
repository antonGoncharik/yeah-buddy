import { z } from "zod";

import { ReviewError } from "@/lib/ai/errors";
import {
  REVIEW_HEADLINE_CHARS,
  REVIEW_OBSERVATION_CHARS,
  REVIEW_OBSERVATION_MAX,
  REVIEW_SYSTEM_PROMPT,
  REVIEW_USER_LEAD,
  REVIEW_WATCH_CHARS,
  REVIEW_WATCH_MAX,
  reviewPromptPayload,
} from "@/lib/ai/prompt";
import type { ReviewBrief, ReviewText, StoredReview } from "@/lib/ai/types";
import { AI_REVIEW_FAILED, AI_REVIEW_NO_KEY } from "@/lib/messages";

const reviewTextSchema = z.object({
  headline: z.string().trim().min(1).max(REVIEW_HEADLINE_CHARS),
  observations: z
    .array(z.string().trim().min(1).max(REVIEW_OBSERVATION_CHARS))
    .min(1)
    .max(REVIEW_OBSERVATION_MAX),
  watch: z
    .array(z.string().trim().min(1).max(REVIEW_WATCH_CHARS))
    .min(1)
    .max(REVIEW_WATCH_MAX),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    observations: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: REVIEW_OBSERVATION_MAX,
    },
    watch: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: REVIEW_WATCH_MAX,
    },
  },
  required: ["headline", "observations", "watch"],
} as const;

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_REVIEW_MODEL = "gemini-3.5-flash";

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

export function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model || DEFAULT_MODEL;
}

export function getGeminiReviewModel(): string {
  const model = process.env.GEMINI_REVIEW_MODEL?.trim();
  return model || DEFAULT_REVIEW_MODEL;
}

export type GeminiUserPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function generateGeminiJson({
  system,
  parts,
  schema,
  temperature,
  timeoutMs = 25_000,
  maxOutputTokens,
  failedMessage,
  model: modelOverride,
  thinkingLevel,
}: {
  system: string;
  parts: GeminiUserPart[];
  schema: object;
  temperature?: number;
  timeoutMs?: number;
  maxOutputTokens?: number;
  failedMessage: string;
  model?: string;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}): Promise<unknown> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const model = encodeURIComponent(modelOverride?.trim() || getGeminiModel());
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
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: schema,
          ...(thinkingLevel
            ? {
                thinkingConfig: {
                  thinkingLevel: thinkingLevel.toUpperCase(),
                },
              }
            : {}),
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("gemini request failed", response.status, payload);
    throw new ReviewError("GEMINI", failedMessage);
  }

  const text = readCandidateText(payload);
  if (!text) {
    console.error("gemini empty candidate", summarizeGeminiFailure(payload));
    throw new ReviewError("GEMINI", failedMessage);
  }

  try {
    return readJson(text);
  } catch {
    throw new ReviewError("GEMINI", failedMessage);
  }
}

export async function writeReview(
  brief: ReviewBrief,
  previous: StoredReview | null = null,
): Promise<ReviewText> {
  const payload = await generateGeminiJson({
    system: REVIEW_SYSTEM_PROMPT,
    parts: [
      { text: REVIEW_USER_LEAD },
      { text: JSON.stringify(reviewPromptPayload(brief, previous)) },
    ],
    schema: RESPONSE_SCHEMA,
    temperature: 0.75,
    timeoutMs: 75_000,
    maxOutputTokens: 24_576,
    failedMessage: AI_REVIEW_FAILED,
    model: getGeminiReviewModel(),
    thinkingLevel: "medium",
  });

  const parsed = reviewTextSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ReviewError("GEMINI", AI_REVIEW_FAILED);
  }

  return {
    headline: parsed.data.headline,
    observations: parsed.data.observations.slice(0, REVIEW_OBSERVATION_MAX),
    watch: parsed.data.watch.slice(0, REVIEW_WATCH_MAX),
  };
}

function summarizeGeminiFailure(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const record = payload as {
    promptFeedback?: unknown;
    usageMetadata?: unknown;
    candidates?: Array<{
      finishReason?: unknown;
      safetyRatings?: unknown;
    }>;
  };
  return {
    finishReason: record.candidates?.[0]?.finishReason ?? null,
    promptFeedback: record.promptFeedback ?? null,
    usage: record.usageMetadata ?? null,
    safetyRatings: record.candidates?.[0]?.safetyRatings ?? null,
  };
}

function readCandidateText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    candidates?: Array<{
      finishReason?: unknown;
      content?: { parts?: Array<{ text?: unknown; thought?: unknown }> };
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
  const chunks = parts.flatMap((part) => {
    if (part.thought === true) {
      return [];
    }
    return typeof part.text === "string" && part.text.trim() !== ""
      ? [part.text]
      : [];
  });
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
