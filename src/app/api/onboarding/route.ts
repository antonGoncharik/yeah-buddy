import type { NextResponse } from "next/server";

import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  completeOnboarding,
  getOnboardingState,
  onboardingCompleteSchema,
} from "@/lib/onboarding";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const onboarding = await getOnboardingState(auth.session.userId);
    return jsonOk({ onboarding });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, onboardingCompleteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const onboarding = await completeOnboarding(
      auth.session.userId,
      parsed.data,
    );
    return jsonOk({ onboarding });
  } catch (error) {
    return failRoute(error);
  }
}
