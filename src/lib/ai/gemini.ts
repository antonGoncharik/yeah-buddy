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
import {
  AI_REVIEW_FAILED,
  AI_REVIEW_LIMIT,
  AI_REVIEW_NO_KEY,
} from "@/lib/messages";

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

const PLATE_MODEL = "gemini-3.5-flash-lite";
const REVIEW_MODEL = "gemini-3.5-flash";

export type GeminiPurpose = "plate" | "review";

const GEMINI_KEY_LIMIT = 3;
const MINUTE_COOLDOWN_MS = 60_000;
const DEFAULT_COOLDOWN_MS = 15 * 60_000;
const MAX_COOLDOWN_MS = 86_400_000;

const cooledUntil = new Map<string, number>();

export function readGeminiKeys(
  purpose: GeminiPurpose,
  env: Record<string, string | undefined> = process.env,
): string[] {
  const raw =
    purpose === "plate" ? env.GEMINI_PLATE_API_KEY : env.GEMINI_API_KEY;
  if (!raw) {
    return [];
  }

  const keys: string[] = [];
  for (const part of raw.split(",")) {
    const key = part.trim();
    if (!key || keys.includes(key)) {
      continue;
    }
    keys.push(key);
    if (keys.length >= GEMINI_KEY_LIMIT) {
      break;
    }
  }
  return keys;
}

export function readGeminiKey(
  purpose: GeminiPurpose,
  env: Record<string, string | undefined> = process.env,
): string | null {
  return readGeminiKeys(purpose, env)[0] ?? null;
}

export function noteGeminiLimited(
  key: string,
  until: number,
  store: Map<string, number> = cooledUntil,
): void {
  const current = store.get(key) ?? 0;
  if (until > current) {
    store.set(key, until);
  }
}

export function availableGeminiKeys(
  keys: string[],
  now: number,
  store: Map<string, number> = cooledUntil,
): string[] {
  return keys.filter((key) => (store.get(key) ?? 0) <= now);
}

export function geminiCooldownUntil(payload: unknown, now: number): number {
  return now + geminiCooldownMs(payload, now);
}

function geminiCooldownMs(payload: unknown, now: number): number {
  if (quotaText(payload).includes("perday")) {
    return Math.min(
      Math.max(msUntilPacificMidnight(now), MINUTE_COOLDOWN_MS),
      MAX_COOLDOWN_MS,
    );
  }

  const retryMs = readRetryDelayMs(payload);
  if (quotaText(payload).includes("perminute")) {
    return clampCooldown(retryMs ?? MINUTE_COOLDOWN_MS);
  }
  if (retryMs != null) {
    return clampCooldown(retryMs);
  }
  return DEFAULT_COOLDOWN_MS;
}

function clampCooldown(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) {
    return MINUTE_COOLDOWN_MS;
  }
  return Math.min(ms, MAX_COOLDOWN_MS);
}

function quotaText(payload: unknown): string {
  try {
    return JSON.stringify(payload).toLowerCase();
  } catch {
    return "";
  }
}

function readRetryDelayMs(payload: unknown): number | null {
  const delay = findRetryDelay(payload);
  if (typeof delay === "number") {
    return delay > 0 ? Math.round(delay * 1000) : null;
  }
  if (typeof delay === "string") {
    const match = /^(\d+(?:\.\d+)?)s$/.exec(delay.trim());
    if (!match?.[1]) {
      return null;
    }
    const ms = Math.round(Number(match[1]) * 1000);
    return ms > 0 ? ms : null;
  }
  if (!delay || typeof delay !== "object") {
    return null;
  }
  const seconds = Reflect.get(delay, "seconds");
  const nanos = Reflect.get(delay, "nanos");
  const sec =
    typeof seconds === "number"
      ? seconds
      : typeof seconds === "string"
        ? Number(seconds)
        : 0;
  const nano = typeof nanos === "number" ? nanos : 0;
  const ms = sec * 1000 + nano / 1_000_000;
  return ms > 0 ? Math.round(ms) : null;
}

function findRetryDelay(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return null;
  }
  if (Reflect.has(value, "retryDelay")) {
    return Reflect.get(value, "retryDelay");
  }
  for (const child of Object.values(value)) {
    const found = findRetryDelay(child);
    if (found != null) {
      return found;
    }
  }
  return null;
}

function msUntilPacificMidnight(now: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsed =
    pick("hour") * 3_600_000 + pick("minute") * 60_000 + pick("second") * 1000;
  const left = MAX_COOLDOWN_MS - elapsed;
  return left > 0 ? left : MAX_COOLDOWN_MS;
}

export function getGeminiReviewApiKey(): string | null {
  return readGeminiKey("review");
}

export function getGeminiPlateApiKey(): string | null {
  return readGeminiKey("plate");
}

export function isGeminiLimit(status: number, payload: unknown): boolean {
  if (status === 429) {
    return true;
  }
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const error = Reflect.get(payload, "error");
  if (!error || typeof error !== "object") {
    return false;
  }
  return (
    Reflect.get(error, "status") === "RESOURCE_EXHAUSTED" ||
    Reflect.get(error, "code") === 429
  );
}

export type GeminiUserPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function generateGeminiJson({
  keys,
  system,
  parts,
  schema,
  temperature,
  timeoutMs = 25_000,
  maxOutputTokens,
  failedMessage,
  limitMessage,
  model: modelOverride,
  thinkingLevel,
}: {
  keys: string[];
  system: string;
  parts: GeminiUserPart[];
  schema: object;
  temperature?: number;
  timeoutMs?: number;
  maxOutputTokens?: number;
  failedMessage: string;
  limitMessage?: string;
  model?: string;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}): Promise<unknown> {
  if (keys.length === 0) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const attempt = availableGeminiKeys(keys, Date.now());
  if (attempt.length === 0) {
    throw new ReviewError("LIMIT", limitMessage ?? failedMessage);
  }

  const model = encodeURIComponent(modelOverride?.trim() || PLATE_MODEL);
  const body = JSON.stringify({
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
  });

  for (let index = 0; index < attempt.length; index += 1) {
    const key = attempt[index];
    if (!key) {
      continue;
    }
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      },
    );

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("gemini request failed", response.status, payload);
      if (!isGeminiLimit(response.status, payload)) {
        throw new ReviewError("GEMINI", failedMessage);
      }
      noteGeminiLimited(key, geminiCooldownUntil(payload, Date.now()));
      if (index < attempt.length - 1) {
        continue;
      }
      throw new ReviewError("LIMIT", limitMessage ?? failedMessage);
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

  throw new ReviewError("LIMIT", limitMessage ?? failedMessage);
}

export async function writeReview(
  brief: ReviewBrief,
  previous: StoredReview | null = null,
): Promise<ReviewText> {
  const keys = readGeminiKeys("review");
  if (keys.length === 0) {
    throw new ReviewError("NO_KEY", AI_REVIEW_NO_KEY);
  }

  const payload = await generateGeminiJson({
    keys,
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
    limitMessage: AI_REVIEW_LIMIT,
    model: REVIEW_MODEL,
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
