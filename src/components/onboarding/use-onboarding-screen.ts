"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadPendingPackKind,
  submitOnboardingFinish,
} from "@/components/onboarding/onboarding-finish";
import {
  LIFTS_DRAFT_INVALID,
  LIFTS_NEED_INPUT_OR_SKIP,
  type LiftAnswers,
  type LiftKey,
  liftAnswersDraftInvalid,
  liftAnswersHaveInput,
} from "@/components/onboarding/onboarding-lifts-step";
import {
  type OnboardingStep,
  onboardingSteps,
} from "@/components/onboarding/onboarding-steps";
import { mutateJson } from "@/lib/api-cache";
import type { RationId } from "@/lib/food/ration";
import { decimalDraftLooksValid } from "@/lib/form/numeric-draft";
import { LOAD_FAILED } from "@/lib/messages";
import {
  type OnboardingGoal,
  type OnboardingSex,
  suggestProteinGrams,
} from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import { markProgramEditableHintPending } from "@/lib/workout/program-editable-hint";
import { isProgramPresetId } from "@/lib/workout/program-presets";
import { defaultOnboardingCircle } from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { peekPendingProgramId } from "@/lib/share/pending";
import type { PublicProgramId } from "@/lib/share/program-public";
import { haptic } from "@/lib/telegram/haptic";
import type { UserTrainingAge } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import {
  isOnboardingPresetWeightKg,
  onboardingDefaultWeightKg,
} from "@/components/onboarding/onboarding-weight-ruler";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

export type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

export const PROTEIN_INVALID = "Введи белок от 1 до 400 граммов.";
export const WEIGHT_REQUIRED = "Введи вес.";
export const WEIGHT_INVALID = "Вес от 30 до 250 кг.";
export const SEX_REQUIRED = "Выбери, кто ты.";
export const GOAL_REQUIRED = "Выбери цель.";
export const TRAINING_AGE_REQUIRED = "Выбери стаж.";
export const MODE_REQUIRED = "Выбери, что тебе нужно.";
export const RATION_REQUIRED = "Выбери шаблон или «Настрою сам».";

type GoNextOptions = {
  circleOverride?: OnboardingCircle;
  gymEnabled?: boolean;
  sex?: OnboardingSex;
  goal?: OnboardingGoal;
  trainingAge?: UserTrainingAge;
  ration?: RationId | null;
  skipRation?: boolean;
};

function weightAfterSexPick(value: OnboardingSex, current: string): string {
  const nextDefault = String(onboardingDefaultWeightKg(value));
  if (current.trim() === "") {
    return nextDefault;
  }
  const kg = parseDecimal(current);
  if (kg == null) {
    return nextDefault;
  }
  const rounded = Math.round(kg);
  if (isOnboardingPresetWeightKg(rounded)) {
    return nextDefault;
  }
  return current;
}

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
  const [step, setStep] = useState<OnboardingStep>("mode");
  const [gymEnabled, setGymEnabled] = useState<boolean | null>(null);
  const [sex, setSex] = useState<OnboardingSex | null>(null);
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [trainingAge, setTrainingAge] = useState<UserTrainingAge | null>(null);
  const [ration, setRation] = useState<RationId | null>(null);
  const [skipRation, setSkipRation] = useState(false);
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
      const gymFromLink =
        incomingProgram != null || incoming === "workouts";
      setGymEnabled(gymFromLink ? true : null);
      setCircle(
        incomingProgram ?? defaultOnboardingCircle(onboarding.circle, replay),
      );
      if (replay) {
        setSex(onboarding.settings.sex);
        setGoal(onboarding.settings.goal);
        setTrainingAge(onboarding.settings.training_age);
      }
      setStep(replay ? "sex" : "mode");
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
        gymEnabled: gymEnabled === true,
      }),
    [gymEnabled, pendingKind, pendingProgramId, replay],
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

  function goNext(options?: GoNextOptions) {
    if (saving) {
      return;
    }

    const circleOverride = options?.circleOverride;
    const effectiveGym = options?.gymEnabled ?? gymEnabled;
    const effectiveSex = options?.sex ?? sex;
    const effectiveGoal = options?.goal ?? goal;
    const effectiveTrainingAge = options?.trainingAge ?? trainingAge;
    const effectiveSkipRation = options?.skipRation ?? skipRation;
    const effectiveRation =
      options?.ration !== undefined ? options.ration : ration;

    const activeSteps = onboardingSteps({
      pendingKind,
      pendingProgram: pendingProgramId != null,
      replay,
      gymEnabled: effectiveGym === true,
    });
    const activeIndex = Math.max(0, activeSteps.indexOf(step));

    if (step === "mode") {
      if (effectiveGym == null) {
        haptic("warn");
        setError(MODE_REQUIRED);
        return;
      }
      setError(null);
    }

    if (step === "sex") {
      if (effectiveSex == null) {
        haptic("warn");
        setError(SEX_REQUIRED);
        return;
      }
      setError(null);
    }

    if (step === "weight") {
      if (effectiveSex == null) {
        haptic("warn");
        setError(SEX_REQUIRED);
        setStep("sex");
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
      setError(null);
    }

    if (step === "goal") {
      if (effectiveGoal == null) {
        haptic("warn");
        setError(GOAL_REQUIRED);
        return;
      }
      setError(null);
    }

    if (step === "training_age") {
      if (effectiveTrainingAge == null) {
        haptic("warn");
        setError(TRAINING_AGE_REQUIRED);
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

    if (step === "ration") {
      if (!effectiveSkipRation && effectiveRation == null) {
        haptic("warn");
        setError(RATION_REQUIRED);
        return;
      }
      setError(null);
    }

    if (step === "lifts") {
      if (!liftAnswersHaveInput(lifts)) {
        haptic("warn");
        setError(LIFTS_NEED_INPUT_OR_SKIP);
        return;
      }
      if (liftAnswersDraftInvalid(lifts)) {
        haptic("warn");
        setError(LIFTS_DRAFT_INVALID);
        return;
      }
      setError(null);
    }

    if (options?.gymEnabled !== undefined) {
      setGymEnabled(options.gymEnabled);
    }
    if (options?.sex !== undefined) {
      setSex(options.sex);
      setWeight((current) => weightAfterSexPick(options.sex!, current));
    }
    if (options?.goal !== undefined) {
      setGoal(options.goal);
    }
    if (options?.trainingAge !== undefined) {
      setTrainingAge(options.trainingAge);
    }
    if (options?.skipRation !== undefined) {
      setSkipRation(options.skipRation);
    }
    if (options?.ration !== undefined) {
      setRation(options.ration);
    }

    const following = activeSteps[activeIndex + 1];
    if (following) {
      if (circleOverride) {
        setCircle(circleOverride);
      }
      setStep(following);
      return;
    }

    setSaving(true);
    setError(null);
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
        setSaving(false);
        setError(SEX_REQUIRED);
        setStep("sex");
        return;
      }
      if (!weightDraftOk(weight)) {
        haptic("warn");
        setSaving(false);
        setError(weight.trim() === "" ? WEIGHT_REQUIRED : WEIGHT_INVALID);
        setStep("weight");
        return;
      }
      if (goal == null) {
        haptic("warn");
        setSaving(false);
        setError(GOAL_REQUIRED);
        setStep("goal");
        return;
      }
      if (gymEnabled && trainingAge == null) {
        haptic("warn");
        setSaving(false);
        setError(TRAINING_AGE_REQUIRED);
        setStep("training_age");
        return;
      }
      if (!proteinValid(proteinValue)) {
        haptic("warn");
        setSaving(false);
        setError(PROTEIN_INVALID);
        setStep("macros");
        return;
      }
    }

    if (gymEnabled == null) {
      haptic("warn");
      setSaving(false);
      setError(MODE_REQUIRED);
      setStep("mode");
      return;
    }

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
        ration: skipRation ? null : ration,
        gymEnabled: gymEnabled === true,
      });
      if (isProgramPresetId(chosen) || pendingProgramId != null) {
        markProgramEditableHintPending();
      }
      router.replace(href);
      haptic("success");
    } catch (caught) {
      haptic("error");
      setSaving(false);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  function pickSelfRation() {
    haptic("tick");
    goNext({ skipRation: true, ration: null });
  }

  function skipLifts() {
    setLifts(emptyLiftAnswers());
    setError(null);
    haptic("tick");
    const following = steps[stepIndex + 1];
    if (following) {
      setStep(following);
      return;
    }
    setSaving(true);
    void finish();
  }

  function confirmLifts() {
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
    gymEnabled,
    foodOnly: gymEnabled === false,
    lifts,
    circle,
    setCircle,
    onGymModePick: (enabled: boolean) => {
      haptic("tick");
      goNext({ gymEnabled: enabled });
    },
    goBack,
    goNext,
    pickSelfRation,
    skipLifts,
    confirmLifts,
    rationSelfSetup: skipRation,
    weightInvalid: error === WEIGHT_REQUIRED || error === WEIGHT_INVALID,
    onSexPick: (value: OnboardingSex) => {
      goNext({ sex: value });
    },
    onWeightChange: (value: string) => {
      setError(null);
      setWeight(value);
    },
    onGoalPick: (value: OnboardingGoal) => {
      goNext({ goal: value });
    },
    onTrainingAgePick: (value: UserTrainingAge) => {
      goNext({ trainingAge: value });
    },
    onLiftChange: (key: LiftKey, value: string | null) => {
      setError(null);
      setLifts((current) => ({ ...current, [key]: value }));
    },
    onRationPick: (value: RationId) => {
      haptic("tick");
      goNext({ ration: value, skipRation: false });
    },
  };
}
