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
import { GUIDE_HREF } from "@/lib/guide";
import { LOAD_FAILED } from "@/lib/messages";
import { macroGoalsFromProtein } from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import {
  defaultOnboardingCircle,
  onboardingWeightExercises,
} from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { haptic } from "@/lib/telegram/haptic";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

export type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

export function useOnboardingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replay = searchParams.get("again") === "1";
  const tourRequest = searchParams.get("tour") === "1";
  const fromSettings = searchParams.get("from") === "settings";
  const [state, setState] = useState<OnboardingState | null>(null);
  const [tour, setTour] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>("food");
  const [protein, setProtein] = useState("120");
  const [skipFood, setSkipFood] = useState(false);
  const [circle, setCircle] = useState<OnboardingCircle>(
    RECOMMENDED_PROGRAM_PRESET_ID,
  );
  const [maxInputs, setMaxInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pendingKind, setPendingKind] = useState<SharePackKind | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson("/api/onboarding");
      const onboarding = parseOnboardingState(data);
      if (!onboarding) {
        throw new Error(LOAD_FAILED);
      }
      const nextTour = Boolean(onboarding.completed && tourRequest && !replay);
      if (onboarding.completed && !replay && !nextTour) {
        router.replace("/today");
        return;
      }
      const incoming = replay || nextTour ? null : await loadPendingPackKind();
      setTour(nextTour);
      setPendingKind(incoming);
      setState(onboarding);
      setProtein(String(onboarding.settings.rest_protein));
      setSkipFood(incoming === "meals");
      setCircle(defaultOnboardingCircle(onboarding.circle, replay));
      setMaxInputs(
        Object.fromEntries(
          onboarding.exercises.map((exercise) => [
            exercise.id,
            exercise.current_max
              ? formatWeight(exercise.current_max.max_weight)
              : "",
          ]),
        ),
      );
      setStep(
        nextTour || (!onboarding.completed && !replay) ? "guide" : "food",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [replay, router, tourRequest]);

  useEffect(() => {
    void load();
  }, [load]);

  const proteinValue = parseDecimal(protein);
  const preview =
    proteinValue != null && proteinValue > 0 && state
      ? macroGoalsFromProtein(proteinValue, state.settings)
      : null;
  const weightExercises = state
    ? onboardingWeightExercises(circle, state.exercises)
    : [];

  const steps = useMemo(
    () => onboardingSteps({ pendingKind, replay, tour, circle, state }),
    [circle, pendingKind, replay, state, tour],
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
      if (proteinValue == null || proteinValue <= 0 || proteinValue > 400) {
        haptic("warn");
        setError("Нужно число в граммах.");
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

  async function finish(options?: {
    omitProtein?: boolean;
    omitMaxes?: boolean;
  }) {
    const omitProtein = Boolean(
      options?.omitProtein || skipFood || pendingKind === "meals",
    );
    if (!omitProtein) {
      if (proteinValue == null || proteinValue <= 0 || proteinValue > 400) {
        haptic("warn");
        setError("Нужно число в граммах.");
        setStep("food");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const href = await submitOnboardingFinish({
        omitProtein,
        omitMaxes: Boolean(options?.omitMaxes),
        proteinValue,
        pendingKind,
        replay,
        circle,
        maxesLocked: Boolean(state?.maxesLocked),
        maxInputs,
      });
      router.replace(href);
      haptic("success");
      router.refresh();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  function leaveTour() {
    router.replace(fromSettings ? GUIDE_HREF : "/today");
  }

  function onProteinChange(value: string) {
    setError(null);
    setSkipFood(false);
    setProtein(value);
  }

  function onMaxChange(id: string, value: string) {
    setMaxInputs((current) => ({ ...current, [id]: value }));
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
    protein,
    preview,
    circle,
    setCircle,
    maxInputs,
    weightExercises,
    goBack,
    goNext,
    skipFoodStep,
    finish,
    leaveTour,
    fromSettings,
    tour,
    onProteinChange,
    onMaxChange,
  };
}
