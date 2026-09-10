import { NextResponse } from "next/server";

import { isIsoDate } from "@/lib/day/dates";
import { CHECK_DATE, CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";

export function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status });
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

interface ZodLike<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
}

export async function parseJsonSchema<T>(
  request: Request,
  schema: ZodLike<T>,
  extra?: (data: T) => boolean,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError(CHECK_FIELDS, 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success || (extra && !extra(parsed.data))) {
    return { ok: false, response: jsonError(CHECK_FIELDS, 400) };
  }

  return { ok: true, data: parsed.data };
}

export function readHistoryQuery(
  request: Request,
):
  | { ok: true; before: string | undefined; limit: number }
  | { ok: false; response: NextResponse } {
  const params = new URL(request.url).searchParams;
  const before = params.get("before");
  const limitRaw = params.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 30;

  if (before && !isIsoDate(before)) {
    return { ok: false, response: jsonError(CHECK_DATE, 400) };
  }

  if (!Number.isFinite(limit) || limit < 1) {
    return { ok: false, response: jsonError(CHECK_FIELDS, 400) };
  }

  return { ok: true, before: before ?? undefined, limit };
}

export function failRoute(
  error: unknown,
  handlers: Array<(error: unknown) => NextResponse | null> = [],
): NextResponse {
  for (const handler of handlers) {
    const response = handler(error);
    if (response) {
      return response;
    }
  }

  console.error(error);
  return jsonError(LOAD_FAILED, 500);
}

export function whenError(
  ctor: new () => Error,
  status: number,
  extra?: (error: Error) => Record<string, unknown>,
): (error: unknown) => NextResponse | null {
  return (error) => {
    if (error instanceof ctor) {
      return jsonError(error.message, status, extra?.(error));
    }
    return null;
  };
}

export function whenMessage(
  message: string,
  status: number,
  userMessage = message,
): (error: unknown) => NextResponse | null {
  return (error) => {
    if (error instanceof Error && error.message === message) {
      return jsonError(userMessage, status);
    }
    return null;
  };
}
