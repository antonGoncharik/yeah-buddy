"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OnboardingProgramShelf } from "@/components/onboarding/onboarding-circle-step";
import {
  emptyLiftAnswers,
  optionalBirthYear,
  optionalHeightCm,
  parseLiftKg,
  weightAfterSexPick,
  weightValid,
} from "@/components/onboarding/onboarding-draft";
import {
  loadPendingPackKind,
  submitOnboardingFinish,
} from "@/components/onboarding/onboarding-finish";
import type {
  LiftAnswers,
  LiftKey,
} from "@/components/onboarding/onboarding-lifts-step";
import {
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-messages";
import {
  onboardingAdvanceBlock,
  onboardingFinishBlock,
} from "@/components/onboarding/onboarding-step-ready";
import {
  isOnboardingStep,
  type OnboardingStep,
  onboardingSteps,
} from "@/components/onboarding/onboarding-steps";
import {
  onboardingWizardSub,
  parseGuidePageIndex,
  parseProgramShelf,
} from "@/components/onboarding/onboarding-wizard-sub";
import { trackClientEvent } from "@/lib/analytics/client";
import { mutateJson } from "@/lib/api-cache";
import type { RationId } from "@/lib/food/ration";
import { LOAD_FAILED } from "@/lib/messages";
import { useWizardScreenHistory } from "@/lib/navigation/use-wizard-screen-history";
import type { WizardScreenEntry } from "@/lib/navigation/wizard-history";
import {
  type OnboardingGoal,
  type OnboardingSex,
  suggestMacroGoals,
} from "@/lib/nutrition";
import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { parseOnboardingState } from "@/lib/onboarding/map";
import {
  defaultOnboardingCircle,
  programForTrainingAge,
} from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { peekPendingProgramId } from "@/lib/share/pending";
import type { PublicProgramId } from "@/lib/share/program-public";
import { haptic } from "@/lib/telegram/haptic";
import type {
  UserActivityLevel,
  UserGoalPace,
  UserTrainingAge,
} from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { markProgramEditableHintPending } from "@/lib/workout/program-editable-hint";
import {
  isProgramPresetId,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

export {
  ACTIVITY_REQUIRED,
  GOAL_REQUIRED,
  MODE_REQUIRED,
  PACE_REQUIRED,
  PROFILE_BIRTH_INVALID,
  PROFILE_HEIGHT_INVALID,
  PROTEIN_INVALID,
  RATION_REQUIRED,
  SEX_REQUIRED,
  TRAINING_AGE_REQUIRED,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-messages";
export type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

const ONBOARDING_WIZARD_FLOW = "onboarding";

type GoNextOptions = {
  circleOverride?: OnboardingCircle;
  gymEnabled?: boolean;
  sex?: OnboardingSex;
  goal?: OnboardingGoal;
  trainingAge?: UserTrainingAge;
  activity?: UserActivityLevel;
  goalPace?: UserGoalPace | null;
  ration?: RationId | null;
  skipRation?: boolean;
  skipLiftsStep?: boolean;
  skipProfileStep?: boolean;
};

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
  const [activity, setActivity] = useState<UserActivityLevel | null>(null);
  const [goalPace, setGoalPace] = useState<UserGoalPace | null>("normal");
  const [heightCm, setHeightCm] = useState("");
  const [birthYear, setBirthYear] = useState("");
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
  const [guidePageIndex, setGuidePageIndex] = useState(0);
  const [programShelf, setProgramShelf] =
    useState<OnboardingProgramShelf | null>(null);

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
      const gymFromLink = incomingProgram != null || incoming === "workouts";
      setGymEnabled(gymFromLink ? true : null);
      setCircle(
        incomingProgram ??
          defaultOnboardingCircle(
            onboarding.circle,
            replay,
            onboarding.settings.training_age,
          ),
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
  const parsedHeight = parseDecimal(heightCm);
  const birth = optionalBirthYear(birthYear);
  const birthYearValid = birth.ok;
  const heightValid = optionalHeightCm(heightCm).ok;
  const parsedBirthYear = birth.year;
  const macroPreview =
    sex && goal && weightValid(weightKg)
      ? suggestMacroGoals({
          sex,
          weightKg,
          goal,
          activity_level: activity,
          height_cm: parsedHeight,
          birth_year: parsedBirthYear,
          goal_pace: goal === "keep" ? null : goalPace,
        })
      : null;
  const proteinValue =
    macroPreview != null ? Math.round(macroPreview.protein) : null;

  const steps = useMemo(() => {
    const listed = onboardingSteps({
      pendingKind,
      pendingProgram: pendingProgramId != null,
      replay,
      gymEnabled: gymEnabled === true,
    });
    if (goal === "keep") {
      return listed.filter((id) => id !== "pace");
    }
    return listed;
  }, [goal, gymEnabled, pendingKind, pendingProgramId, replay]);

  useEffect(() => {
    if (!steps.includes(step)) {
      setStep(steps.includes("circle") ? "circle" : (steps[0] ?? "sex"));
    }
  }, [step, steps]);

  useEffect(() => {
    if (loading || state == null) {
      return;
    }
    void trackClientEvent("onboarding_step_view", { step });
  }, [loading, state, step]);

  const stepIndex = Math.max(0, steps.indexOf(step));
  const isLast = step === steps[steps.length - 1];

  const restoreWizardStep = useCallback(
    (entry: WizardScreenEntry) => {
      setError(null);
      const parsed = isOnboardingStep(entry.step) ? entry.step : null;
      const nextStep =
        parsed != null && steps.includes(parsed)
          ? parsed
          : (steps[0] ?? "mode");
      setGuidePageIndex(parseGuidePageIndex(entry.sub));
      setProgramShelf(parseProgramShelf(entry.sub));
      setStep(nextStep);
    },
    [steps],
  );

  const { retreat } = useWizardScreenHistory({
    flow: ONBOARDING_WIZARD_FLOW,
    step,
    sub: onboardingWizardSub(step, guidePageIndex, programShelf),
    enabled: !loading && state != null,
    onRestore: restoreWizardStep,
  });

  const goBack = useCallback(() => {
    if (programShelf == null && guidePageIndex <= 0 && stepIndex <= 0) {
      return;
    }
    setError(null);
    retreat();
  }, [guidePageIndex, programShelf, retreat, stepIndex]);

  function goNext(options?: GoNextOptions) {
    if (saving) {
      return;
    }

    const circleOverride = options?.circleOverride;
    const effectiveGym = options?.gymEnabled ?? gymEnabled;
    const effectiveSex = options?.sex ?? sex;
    const effectiveGoal = options?.goal ?? goal;
    const effectiveTrainingAge = options?.trainingAge ?? trainingAge;
    const effectiveActivity = options?.activity ?? activity;
    const effectiveGoalPace = options?.goalPace ?? goalPace;
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

    const blocked = onboardingAdvanceBlock({
      step,
      gymEnabled: effectiveGym,
      sex: effectiveSex,
      weight,
      activity: effectiveActivity,
      heightOk: heightValid,
      birthYearOk: birthYearValid,
      skipProfile: options?.skipProfileStep === true,
      goal: effectiveGoal,
      goalPace: effectiveGoalPace,
      trainingAge: effectiveTrainingAge,
      proteinValue,
      skipRation: effectiveSkipRation,
      ration: effectiveRation,
      skipLifts: options?.skipLiftsStep === true,
      lifts,
    });
    if (blocked) {
      haptic("warn");
      setError(blocked.message);
      if (blocked.step) {
        setStep(blocked.step);
      }
      return;
    }
    setError(null);

    if (options?.gymEnabled !== undefined) {
      setGymEnabled(options.gymEnabled);
    }
    if (options?.sex !== undefined) {
      const sex = options.sex;
      setSex(sex);
      setWeight((current) => weightAfterSexPick(sex, current));
    }
    if (options?.goal !== undefined) {
      setGoal(options.goal);
    }
    if (options?.trainingAge !== undefined) {
      const age = options.trainingAge;
      setTrainingAge(age);
      setCircle((current) =>
        current === "empty" ||
        current === "full_body" ||
        current === "five_by_five" ||
        current === "upper_lower"
          ? programForTrainingAge(age)
          : current,
      );
    }
    if (options?.activity !== undefined) {
      setActivity(options.activity);
    }
    if (options?.goalPace !== undefined) {
      setGoalPace(options.goalPace);
    }
    if (options?.skipProfileStep) {
      setHeightCm("");
      setBirthYear("");
    }
    if (options?.skipRation !== undefined) {
      setSkipRation(options.skipRation);
    }
    if (options?.ration !== undefined) {
      setRation(options.ration);
    }

    let following = activeSteps[activeIndex + 1];
    if (following === "pace" && effectiveGoal === "keep") {
      following = activeSteps[activeIndex + 2];
    }
    if (following) {
      if (circleOverride) {
        setCircle(circleOverride);
      }
      if (following !== "guide") {
        setGuidePageIndex(0);
      }
      if (following !== "circle") {
        setProgramShelf(null);
      }
      void trackClientEvent("onboarding_step_complete", { step });
      setStep(following);
      return;
    }

    void trackClientEvent("onboarding_step_complete", { step });
    setSaving(true);
    setError(null);
    void finish(circleOverride);
  }

  async function finish(circleOverride?: OnboardingCircle, skipTail = false) {
    const chosen =
      circleOverride ??
      (skipTail && gymEnabled === true
        ? programForTrainingAge(trainingAge)
        : circle);
    if (circleOverride) {
      setCircle(circleOverride);
    }
    const omitProtein = pendingKind === "meals";
    const blocked = onboardingFinishBlock({
      omitProtein,
      sex,
      weight,
      goal,
      activity,
      goalPace,
      gymEnabled,
      trainingAge,
      proteinValue,
    });
    if (blocked) {
      haptic("warn");
      setSaving(false);
      setError(blocked.message);
      if (blocked.step) {
        setStep(blocked.step);
      }
      return;
    }

    try {
      const href = await submitOnboardingFinish({
        omitProtein,
        proteinValue,
        sex: omitProtein ? null : sex,
        goal: omitProtein ? null : goal,
        trainingAge: omitProtein ? null : trainingAge,
        activity: omitProtein ? null : activity,
        goalPace: omitProtein ? null : goalPace,
        heightCm: omitProtein || !heightValid ? null : parsedHeight,
        birthYear: omitProtein || !birthYearValid ? null : parsedBirthYear,
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
        ration: skipTail || skipRation ? null : ration,
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
    goNext({ skipLiftsStep: true });
  }

  function confirmLifts() {
    goNext();
  }

  function finishDiary() {
    void finish(undefined, true);
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
    activity,
    goalPace,
    heightCm,
    birthYear,
    ration,
    gymEnabled,
    foodOnly: gymEnabled === false,
    lifts,
    circle,
    setCircle,
    guidePageIndex,
    setGuidePageIndex,
    programShelf,
    setProgramShelf,
    onGymModePick: (enabled: boolean) => {
      haptic("tick");
      goNext({ gymEnabled: enabled });
    },
    goBack,
    goNext,
    pickSelfRation,
    skipLifts,
    confirmLifts,
    finishDiary,
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
      goNext({
        goal: value,
        goalPace: value === "keep" ? null : (goalPace ?? "normal"),
      });
    },
    onActivityPick: (value: UserActivityLevel) => {
      goNext({ activity: value });
    },
    onGoalPacePick: (value: UserGoalPace) => {
      goNext({ goalPace: value });
    },
    onHeightChange: setHeightCm,
    onBirthYearChange: setBirthYear,
    skipProfile: () => goNext({ skipProfileStep: true }),
    confirmProfile: () => goNext(),
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
