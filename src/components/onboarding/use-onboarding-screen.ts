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
import { LOAD_FAILED } from "@/lib/messages";
import { decimalDraftLooksValid } from "@/lib/form/numeric-draft";
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
import type { FeaturedProgramId } from "@/lib/share/program-start";
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
  const [step, setStep] = useState<OnboardingStep>("sex");
  const [sex, setSex] = useState<OnboardingSex | null>(null);
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [trainingAge, setTrainingAge] = useState<UserTrainingAge | null>(null);
  const [proteinOverride, setProteinOverride] = useState<string | null>(null);
  const [lifts, setLifts] = useState<LiftAnswers>(emptyLiftAnswers);
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
      setCircle(
        incomingProgram ?? defaultOnboardingCircle(onboarding.circle, replay),
      );
      if (replay) {
        setSex(onboarding.settings.sex);
        setGoal(onboarding.settings.goal);
        setTrainingAge(onboarding.settings.training_age);
      }
      setStep(replay ? "sex" : "guide");
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
  const override =
    proteinOverride != null ? parseDecimal(proteinOverride) : null;
  const proteinValue =
    override != null && proteinValid(override)
      ? Math.round(override)
      : suggested;

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
      setStep(steps.includes("circle") ? "circle" : (steps[0] ?? "sex"));
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

  const advanceFrom = useCallback(
    (from: OnboardingStep) => {
      const index = steps.indexOf(from);
      const following = steps[index + 1];
      if (following) {
        setError(null);
        setStep(following);
      }
    },
    [steps],
  );

  function goNext() {
    if (step === "weight") {
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
      setError(null);
    }

    if (step === "macros") {
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setError(PROTEIN_INVALID);
        return;
      }
      setError(null);
    }

    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }

    void finish();
  }

  async function finish() {
    const omitProtein = pendingKind === "meals";
    if (!omitProtein) {
      if (sex == null) {
        haptic("warn");
        setError(SEX_REQUIRED);
        setStep("sex");
        return;
      }
      if (!weightDraftOk(weight)) {
        haptic("warn");
        setError(weight.trim() === "" ? WEIGHT_REQUIRED : WEIGHT_INVALID);
        setStep("weight");
        return;
      }
      if (goal == null) {
        haptic("warn");
        setError(GOAL_REQUIRED);
        setStep("goal");
        return;
      }
      if (trainingAge == null) {
        haptic("warn");
        setError(TRAINING_AGE_REQUIRED);
        setStep("training_age");
        return;
      }
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setError(PROTEIN_INVALID);
        setStep("macros");
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
    proteinOverride,
    lifts,
    circle,
    setCircle,
    goBack,
    goNext,
    weightInvalid: error === WEIGHT_REQUIRED || error === WEIGHT_INVALID,
    proteinInvalid: error === PROTEIN_INVALID,
    onSexPick: (value: OnboardingSex) => {
      setSex(value);
      setProteinOverride(null);
      advanceFrom("sex");
    },
    onWeightChange: (value: string) => {
      setError(null);
      setWeight(value);
      setProteinOverride(null);
    },
    onGoalPick: (value: OnboardingGoal) => {
      setGoal(value);
      setProteinOverride(null);
      advanceFrom("goal");
    },
    onTrainingAgePick: (value: UserTrainingAge) => {
      setTrainingAge(value);
      advanceFrom("training_age");
    },
    onLiftChange: (key: LiftKey, value: string | null) => {
      setError(null);
      setLifts((current) => ({ ...current, [key]: value }));
    },
    onProteinOverride: (value: string | null) => {
      setError(null);
      setProteinOverride(value);
    },
  };
}
