import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  TELEGRAM_MINI_APP_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
    TELEGRAM_MINI_APP_URL: process.env.TELEGRAM_MINI_APP_URL || undefined,
  });

  if (!parsed.success) {
    throw new Error("Server environment is not configured");
  }

  cached = parsed.data;
  return cached;
}

export function isHttpsAppUrl(): boolean {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return url.startsWith("https://") || process.env.NODE_ENV === "production";
}
