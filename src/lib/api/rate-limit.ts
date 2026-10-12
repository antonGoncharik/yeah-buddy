import { jsonError } from "@/lib/api/respond";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { ok: true };
}

export function rateLimitResponse(retryAfterSec: number) {
  return jsonError("Слишком много запросов. Подожди.", 429, {
    retryAfter: retryAfterSec,
  });
}

export function rateLimitIp(
  request: Request,
  route: string,
  limit: number,
  windowMs: number,
) {
  const key = `${route}:ip:${clientIp(request)}`;
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

export function rateLimitUser(
  userId: string,
  route: string,
  limit: number,
  windowMs: number,
) {
  const key = `${route}:user:${userId}`;
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}
