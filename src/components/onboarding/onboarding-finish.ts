import {
  mutateJson,
  patchJson,
  postJson,
  writeJson,
} from "@/lib/api-cache";
import { ensureTodayDay } from "@/lib/day/ensure-today";
import type { OnboardingCircle } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import { readSharePackPayload } from "@/lib/share/map";
import type { SharePackKind } from "@/lib/share/payload";
import {
  dismissPendingProgramId,
  packPath,
  peekPendingPackToken,
} from "@/lib/share/pending";
import type { FeaturedProgramId } from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";
import type { UserTrainingAge } from "@/lib/types";

export async function loadPendingPackKind(): Promise<SharePackKind | null> {
  const token = peekPendingPackToken();
  if (!token || !isPackToken(token)) {
    return null;
  }

  try {
    const data = await mutateJson(`/api/packs/${token}`);
    return readSharePackPayload(data)?.kind ?? null;
  } catch {
    return null;
  }
}

export async function submitOnboardingFinish({
  omitProtein,
  proteinValue,
  sex,
  goal,
  trainingAge,
  bodyWeight,
  anchors,
  pendingKind,
  pendingProgramId,
  replay,
  circle,
}: {
  omitProtein: boolean;
  proteinValue: number | null;
  sex: "male" | "female" | null;
  goal: "lose" | "keep" | "gain" | null;
  trainingAge: UserTrainingAge | null;
  bodyWeight: number | null;
  anchors: {
    squat: number | null;
    bench: number | null;
    deadlift: number | null;
  };
  pendingKind: SharePackKind | null;
  pendingProgramId: FeaturedProgramId | null;
  replay: boolean;
  circle: OnboardingCircle;
}): Promise<string> {
  const skipGoals = omitProtein || pendingKind === "meals";
  const data = await postJson("/api/onboarding", {
    ...(skipGoals
      ? {}
      : {
          protein: proteinValue,
          sex,
          goal,
          training_age: trainingAge,
          body_weight: bodyWeight,
          anchors,
        }),
    circle: onboardingFinishCircle({
      pendingProgramId,
      pendingKind,
      replay,
      circle,
    }),
    ...(pendingProgramId ? { fromStart: true } : {}),
  });

  const onboarding = parseOnboardingState(data);
  if (onboarding) {
    writeJson("/api/settings", { settings: onboarding.settings });
    writeJson("/api/onboarding", data);
  }

  if (pendingProgramId) {
    dismissPendingProgramId(pendingProgramId);
  }

  const pending = peekPendingPackToken();
  if (!replay && pendingKind !== "meals") {
    try {
      const dayId = await ensureTodayDay("rest");
      if (dayId && bodyWeight != null && bodyWeight > 0) {
        await patchJson(`/api/days/${dayId}`, { bodyWeight });
      }
    } catch {
      // still leave the master
    }
  }

  return onboardingExitHref(pending);
}

export function onboardingFinishCircle({
  pendingProgramId,
  pendingKind,
  replay,
  circle,
}: {
  pendingProgramId: FeaturedProgramId | null;
  pendingKind: SharePackKind | null;
  replay: boolean;
  circle: OnboardingCircle;
}): OnboardingCircle | "keep" {
  if (pendingProgramId) {
    return pendingProgramId;
  }
  if (replay || pendingKind === "workouts") {
    return "keep";
  }
  return circle;
}

export function onboardingExitHref(pendingToken: string | null): string {
  if (pendingToken && isPackToken(pendingToken)) {
    return packPath(pendingToken);
  }
  return "/today";
}
