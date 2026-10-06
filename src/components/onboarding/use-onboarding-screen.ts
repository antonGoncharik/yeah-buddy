"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadPendingPackKind,
  submitOnboardingFinish,
} from "@/components/onboarding/onboarding-finish";
import type {
  LiftAnswers,
  LiftKey,
} from "@/components/onboarding/onboarding-lifts-step";
import {
  type OnboardingStep,
  onboardingSteps,
} from "@/components/onboarding/onboarding-steps";
import { mutateJson } from "@/lib/api-cache";
import { type RationId, RECOMMENDED_RATION_ID } from "@/lib/food/ration";
import { decimalDraftLooksValid } from "@/lib/form/numeric-draft";
import { LOAD_FAILED } from "@/lib/messages";
import {
  type OnboardingGoal,
  type OnboardingSex,
  suggestProteinGrams,
} from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import { defaultOnboardingCircle } from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { peekPendingProgramId } from "@/lib/share/pending";
import type { PublicProgramId } from "@/lib/share/program-public";
import { haptic } from "@/lib/telegram/haptic";
import type { UserTrainingAge } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

export type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

export const PROTEIN_INVALID = "Введи белок от 1 до 400 граммов.";
export const WEIGHT_REQUIRED = "Введи вес.";
export const WEIGHT_INVALID = "Вес от 30 до 250 кг.";
export const SEX_REQUIRED = "Выбери, кто ты.";
export const GOAL_REQUIRED = "Выбери цель.";
export const TRAINING_AGE_REQUIRED = "Выбери стаж.";

function proteinValid(value: number | null): value is number {
  return value != null && value > 0 && value <= 400;
}

function weightValid(value: number | null): value is number {
  return value != null && value >= 30 && value <= 250;
}

function weightDraftOk(raw: string): boolean {
  return decimalDraftLooksValid(raw) && weightValid(parseDecimal(raw));
}

function emptyLiftAnswers(): LiftAnswers {
  return { squat: "", bench: "", deadlift: "" };
}

function parseLiftKg(raw: string | null): number | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }
  const value = parseDecimal(raw);
  if (value == null || !(value > 0) || value > 500) {
    return null;
  }
  return value;
}

export function useOnboardingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replay = searchParams.get("again") === "1";
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<OnboardingStep>("profile");
  const [sex, setSex] = useState<OnboardingSex | null>(null);
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [trainingAge, setTrainingAge] = useState<UserTrainingAge | null>(null);
  const [ration, setRation] = useState<RationId>(RECOMMENDED_RATION_ID);
  const [lifts, setLifts] = useState<LiftAnswers>(emptyLiftAnswers);
  const [circle, setCircle] = useState<OnboardingCircle>(
    RECOMMENDED_PROGRAM_PRESET_ID,
  );
  const [saving, setSaving] = useState(false);
  const [pendingKind, setPendingKind] = useState<SharePackKind | null>(null);
  const [pendingProgramId, setPendingProgramId] =
    useState<PublicProgramId | null>(null);

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
      setCircle(
        incomingProgram ?? defaultOnboardingCircle(onboarding.circle, replay),
      );
      if (replay) {
        setSex(onboarding.settings.sex);
        setGoal(onboarding.settings.goal);
        setTrainingAge(onboarding.settings.training_age);
      }
      setStep(replay ? "profile" : "guide");
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

  const weightKg = parseDecimal(weight);
  const suggested =
    sex && goal && weightValid(weightKg)
      ? suggestProteinGrams({ sex, weightKg, goal })
      : null;
  const proteinValue = suggested != null ? Math.round(suggested) : null;

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
      setStep(steps.includes("circle") ? "circle" : (steps[0] ?? "profile"));
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

  function goNext(circleOverride?: OnboardingCircle) {
    if (step === "profile") {
      if (sex == null) {
        haptic("warn");
        setError(SEX_REQUIRED);
        return;
      }
      if (weight.trim() === "") {
        haptic("warn");
        setError(WEIGHT_REQUIRED);
        return;
      }
      if (!weightDraftOk(weight)) {
        haptic("warn");
        setError(WEIGHT_INVALID);
        return;
      }
      if (goal == null) {
        haptic("warn");
        setError(GOAL_REQUIRED);
        return;
      }
      if (trainingAge == null) {
        haptic("warn");
        setError(TRAINING_AGE_REQUIRED);
        return;
      }
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setError(PROTEIN_INVALID);
        return;
      }
      setError(null);
    }

    const following = steps[stepIndex + 1];
    if (following) {
      if (circleOverride) {
        setCircle(circleOverride);
      }
      setStep(following);
      return;
    }

    void finish(circleOverride);
  }

  async function finish(circleOverride?: OnboardingCircle) {
    const chosen = circleOverride ?? circle;
    if (circleOverride) {
      setCircle(circleOverride);
    }
    const omitProtein = pendingKind === "meals";
    if (!omitProtein) {
      if (sex == null) {
        haptic("warn");
        setError(SEX_REQUIRED);
        setStep("profile");
        return;
      }
      if (!weightDraftOk(weight)) {
        haptic("warn");
        setError(weight.trim() === "" ? WEIGHT_REQUIRED : WEIGHT_INVALID);
        setStep("profile");
        return;
      }
      if (goal == null) {
        haptic("warn");
        setError(GOAL_REQUIRED);
        setStep("profile");
        return;
      }
      if (trainingAge == null) {
        haptic("warn");
        setError(TRAINING_AGE_REQUIRED);
        setStep("profile");
        return;
      }
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setError(PROTEIN_INVALID);
        setStep("profile");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const href = await submitOnboardingFinish({
        omitProtein,
        proteinValue,
        sex: omitProtein ? null : sex,
        goal: omitProtein ? null : goal,
        trainingAge: omitProtein ? null : trainingAge,
        bodyWeight: omitProtein || !weightValid(weightKg) ? null : weightKg,
        anchors: {
          squat: parseLiftKg(lifts.squat),
          bench: parseLiftKg(lifts.bench),
          deadlift: parseLiftKg(lifts.deadlift),
        },
        pendingKind,
        pendingProgramId,
        replay,
        circle: chosen,
        ration,
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

  function skipLifts() {
    setLifts(emptyLiftAnswers());
    setError(null);
    goNext();
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
    sex,
    weight,
    goal,
    trainingAge,
    ration,
    lifts,
    circle,
    setCircle,
    goBack,
    goNext,
    skipLifts,
    weightInvalid: error === WEIGHT_REQUIRED || error === WEIGHT_INVALID,
    onSexPick: (value: OnboardingSex) => {
      setSex(value);
      setError(null);
    },
    onWeightChange: (value: string) => {
      setError(null);
      setWeight(value);
    },
    onGoalPick: (value: OnboardingGoal) => {
      setGoal(value);
      setError(null);
    },
    onTrainingAgePick: (value: UserTrainingAge) => {
      setTrainingAge(value);
      setError(null);
    },
    onLiftChange: (key: LiftKey, value: string | null) => {
      setError(null);
      setLifts((current) => ({ ...current, [key]: value }));
    },
    onRationPick: (value: RationId) => {
      setRation(value);
    },
  };
}
