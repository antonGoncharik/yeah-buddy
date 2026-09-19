"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  loadPendingPackKind,
  submitOnboardingFinish,
} from "@/components/onboarding/onboarding-finish";
import {
  type OnboardingStep,
  onboardingSteps,
} from "@/components/onboarding/onboarding-steps";
import { mutateJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { macroGoalsFromProtein } from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import { defaultOnboardingCircle } from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { peekPendingProgramId } from "@/lib/share/pending";
import type { FeaturedProgramId } from "@/lib/share/program-start";
import { haptic } from "@/lib/telegram/haptic";
import { parseDecimal } from "@/lib/workout/numbers";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

export type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

export const PROTEIN_INVALID = "Введи число от 1 до 400 граммов.";

function proteinValid(value: number | null): value is number {
  return value != null && value > 0 && value <= 400;
}

export function useOnboardingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replay = searchParams.get("again") === "1";
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>("food");
  const [protein, setProtein] = useState("120");
  const [skipFood, setSkipFood] = useState(false);
  const [circle, setCircle] = useState<OnboardingCircle>(
    RECOMMENDED_PROGRAM_PRESET_ID,
  );
  const [saving, setSaving] = useState(false);
  const [pendingKind, setPendingKind] = useState<SharePackKind | null>(null);
  const [pendingProgramId, setPendingProgramId] =
    useState<FeaturedProgramId | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson("/api/onboarding");
      const onboarding = parseOnboardingState(data);
      if (!onboarding) {
        throw new Error(LOAD_FAILED);
      }
      if (onboarding.completed && !replay) {
        router.replace("/today");
        return;
      }
      const incoming = replay ? null : await loadPendingPackKind();
      const incomingProgram = replay ? null : peekPendingProgramId();
      setPendingKind(incoming);
      setPendingProgramId(incomingProgram);
      setState(onboarding);
      setProtein(String(onboarding.settings.rest_protein));
      setSkipFood(incoming === "meals");
      setCircle(
        incomingProgram ?? defaultOnboardingCircle(onboarding.circle, replay),
      );
      setStep(replay ? "food" : "guide");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [replay, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const proteinValue = parseDecimal(protein);
  const preview =
    proteinValid(proteinValue) && state
      ? macroGoalsFromProtein(proteinValue, state.settings)
      : null;

  const steps = useMemo(
    () =>
      onboardingSteps({
        pendingKind,
        pendingProgram: pendingProgramId != null,
        replay,
      }),
    [pendingKind, pendingProgramId, replay],
  );

  useEffect(() => {
    if (!steps.includes(step)) {
      setStep(steps.includes("circle") ? "circle" : (steps[0] ?? "food"));
    }
  }, [step, steps]);

  const stepIndex = Math.max(0, steps.indexOf(step));
  const isLast = step === steps[steps.length - 1];

  const goBack = useCallback(() => {
    const previous = steps[stepIndex - 1];
    if (previous) {
      setError(null);
      setStep(previous);
    }
  }, [stepIndex, steps]);

  function goNext() {
    if (step === "food") {
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setError(PROTEIN_INVALID);
        return;
      }
      setSkipFood(false);
      setError(null);
    }

    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }

    void finish();
  }

  function skipFoodStep() {
    setError(null);
    setSkipFood(true);
    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }
    void finish({ omitProtein: true });
  }

  async function finish(options?: { omitProtein?: boolean }) {
    const omitProtein = Boolean(
      options?.omitProtein || skipFood || pendingKind === "meals",
    );
    if (!omitProtein && !proteinValid(proteinValue)) {
      haptic("warn");
      setError(PROTEIN_INVALID);
      setStep("food");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const href = await submitOnboardingFinish({
        omitProtein,
        proteinValue,
        pendingKind,
        pendingProgramId,
        replay,
        circle,
      });
      router.replace(href);
      haptic("success");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function onProteinChange(value: string) {
    setError(null);
    setSkipFood(false);
    setProtein(value);
  }

  return {
    loading,
    error,
    state,
    load,
    step,
    steps,
    stepIndex,
    isLast,
    saving,
    replay,
    pendingKind,
    pendingProgramId,
    protein,
    preview,
    circle,
    setCircle,
    goBack,
    goNext,
    skipFoodStep,
    onProteinChange,
  };
}
