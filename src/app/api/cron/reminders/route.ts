import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { getServerEnv } from "@/lib/env";
import {
  isCronAuthorized,
  runEveningReminders,
} from "@/lib/telegram/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  return runCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return runCron(request);
}

async function runCron(request: Request): Promise<NextResponse> {
  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (error) {
    return failRoute(error);
  }

  if (!isCronAuthorized(request, env.CRON_SECRET)) {
    return jsonError("Unauthorized", 401);
  }

  try {
    return jsonOk(await runEveningReminders());
  } catch (error) {
    return failRoute(error);
  }
}
