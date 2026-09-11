import { mutateJson, postJson, writeJson } from "@/lib/api-cache";
import { ensureTodayDay } from "@/lib/day/ensure-today";
import type { OnboardingCircle } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding-map";
import { readSharePackPayload } from "@/lib/share/map";
import type { SharePackKind } from "@/lib/share/payload";
import { packPath, peekPendingPackToken } from "@/lib/share/pending";
import { isPackToken } from "@/lib/share/token";
import { parseDecimal } from "@/lib/workout/numbers";

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
  omitMaxes,
  proteinValue,
  pendingKind,
  replay,
  circle,
  maxesLocked,
  maxInputs,
}: {
  omitProtein: boolean;
  omitMaxes: boolean;
  proteinValue: number | null;
  pendingKind: SharePackKind | null;
  replay: boolean;
  circle: OnboardingCircle;
  maxesLocked: boolean;
  maxInputs: Record<string, string>;
}): Promise<string> {
  const maxes = omitMaxes
    ? []
    : Object.entries(maxInputs).flatMap(([exerciseId, raw]) => {
        const maxWeight = parseDecimal(raw);
        if (maxWeight == null || maxWeight <= 0) {
          return [];
        }
        return [{ exerciseId, maxWeight }];
      });

  const data = await postJson("/api/onboarding", {
    ...(omitProtein || pendingKind === "meals"
      ? {}
      : { protein: proteinValue }),
    circle: replay || pendingKind === "workouts" ? "keep" : circle,
    maxes: maxesLocked || pendingKind === "workouts" ? [] : maxes,
  });

  const onboarding = parseOnboardingState(data);
  if (onboarding) {
    writeJson("/api/settings", { settings: onboarding.settings });
    writeJson("/api/onboarding", data);
  }

  const pending = peekPendingPackToken();
  if (!replay && pendingKind !== "meals") {
    try {
      await ensureTodayDay("rest");
    } catch {
      // still leave the master
    }
  }

  return pending && isPackToken(pending) ? packPath(pending) : "/today";
}
