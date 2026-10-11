import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  completeOnboarding,
  getOnboardingState,
  onboardingCompleteSchema,
} from "@/lib/onboarding";
import { ProgramNotOfferedError } from "@/lib/workout/templates";

export const GET = sessionRoute(async (session) => {
  const onboarding = await getOnboardingState(session.userId);
  return jsonOk({ onboarding });
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, onboardingCompleteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const onboarding = await completeOnboarding(session.userId, parsed.data);
    return jsonOk({ onboarding });
  } catch (error) {
    return failRoute(error, [whenError(ProgramNotOfferedError, 403)]);
  }
});
