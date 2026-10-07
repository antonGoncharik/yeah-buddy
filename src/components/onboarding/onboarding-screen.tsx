"use client";

import { useEffect, useState } from "react";

import { GuideTour } from "@/components/guide/guide-tour";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import {
  OnboardingCircleStep,
  type OnboardingProgramShelf,
} from "@/components/onboarding/onboarding-circle-step";
import {
  OnboardingProfileStep,
  profileStepSubtitle,
} from "@/components/onboarding/onboarding-food-step";
import { OnboardingLiftsStep } from "@/components/onboarding/onboarding-lifts-step";
import { OnboardingRationStep } from "@/components/onboarding/onboarding-ration-step";
import {
  OnboardingStepDots,
  OnboardingStepShell,
} from "@/components/onboarding/onboarding-shell";
import {
  type OnboardingStep,
  onboardingSetupSteps,
  onboardingStepNeedsNext,
} from "@/components/onboarding/onboarding-steps";
import {
  GOAL_REQUIRED,
  SEX_REQUIRED,
  TRAINING_AGE_REQUIRED,
  useOnboardingScreen,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/use-onboarding-screen";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import {
  isProgramPresetId,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

export function OnboardingScreen() {
  const {
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
    confirmLifts,
    weightInvalid,
    onSexPick,
    onWeightChange,
    onGoalPick,
    onTrainingAgePick,
    onLiftChange,
    onRationPick,
  } = useOnboardingScreen();
  const [programShelf, setProgramShelf] =
    useState<OnboardingProgramShelf | null>(null);
  const pickingProgram = programShelf != null;

  useEffect(() => {
    if (step !== "circle") {
      setProgramShelf(null);
    }
  }, [step]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <ScreenLoading />
      </main>
    );
  }

  if (!state) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <ScreenError
          message={error ?? LOAD_FAILED}
          onRetry={() => void load()}
        />
      </main>
    );
  }

  if (step === "guide") {
    return <GuideTour error={error} onDone={goNext} onSkip={goNext} />;
  }

  const setupSteps = onboardingSetupSteps(steps);
  const setupIndex = Math.max(0, setupSteps.indexOf(step));
  const showNext =
    step === "circle" ? pickingProgram : onboardingStepNeedsNext(step);
  const canLeaveStep = stepIndex > 0 || pickingProgram;
  const weightFieldError =
    error === WEIGHT_REQUIRED || error === WEIGHT_INVALID;
  const profileFieldError =
    error === SEX_REQUIRED ||
    error === GOAL_REQUIRED ||
    error === TRAINING_AGE_REQUIRED;

  function handleBack() {
    if (step === "circle" && pickingProgram) {
      setProgramShelf(null);
      return;
    }
    goBack();
  }

  const sticky = (
    <>
      {step === "lifts" ? (
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full text-base"
          data-keyboard-secondary
          disabled={saving}
          onClick={() => skipLifts()}
        >
          Не знаю — посчитай сам
        </Button>
      ) : null}
      <Button
        className="h-14 w-full text-lg"
        disabled={saving}
        onClick={() => void (step === "lifts" ? confirmLifts() : goNext())}
      >
        {saving ? "Секунду…" : isLast ? "Готово" : "Дальше"}
      </Button>
    </>
  );

  return (
    <>
      <OnboardingStepShell
        canGoBack={canLeaveStep}
        onBack={handleBack}
        progressLabel={`Настройка ${setupIndex + 1} из ${setupSteps.length}`}
        stepDots={<OnboardingStepDots steps={setupSteps} current={step} />}
        title={titleForStep(step, programShelf)}
        subtitle={subtitleForStep(step, replay, pendingKind, pendingProgramId)}
        showSticky={showNext}
        sticky={sticky}
      >
      {step === "profile" ? (
        <>
          <OnboardingProfileStep
            sex={sex}
            weight={weight}
            goal={goal}
            trainingAge={trainingAge}
            weightInvalid={weightInvalid}
            weightMessage={weightFieldError ? error : null}
            onSexPick={onSexPick}
            onWeightChange={onWeightChange}
            onGoalPick={onGoalPick}
            onTrainingAgePick={onTrainingAgePick}
          />
          {error && profileFieldError ? (
            <p className="mt-2 text-center text-sm text-destructive">{error}</p>
          ) : null}
        </>
      ) : null}

      {step === "ration" ? (
        <OnboardingRationStep
          ration={ration}
          sex={sex}
          weight={weight}
          goal={goal}
          onPick={onRationPick}
        />
      ) : null}

      {step === "lifts" ? (
        <OnboardingLiftsStep answers={lifts} onChange={onLiftChange} />
      ) : null}

      {step === "circle" ? (
        <OnboardingCircleStep
          value={circle}
          fromMealPack={pendingKind === "meals"}
          picking={pickingProgram}
          shelf={programShelf}
          saving={saving}
          sex={sex}
          onChange={setCircle}
          onBeginner={() => void goNext(RECOMMENDED_PROGRAM_PRESET_ID)}
          onHome={() => {
            setProgramShelf("home");
            if (sex === "female" && !isProgramPresetId(circle)) {
              setCircle("home_glutes");
            }
          }}
          onPickYourself={() => setProgramShelf("all")}
        />
      ) : null}

      {error && step !== "profile" ? (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      ) : null}
      </OnboardingStepShell>
      {saving ? (
        <ScreenLoading cover title="Сохраняем настройки…" />
      ) : null}
    </>
  );
}

function titleForStep(
  step: OnboardingStep,
  shelf: OnboardingProgramShelf | null,
): string {
  if (step === "profile") {
    return "Про тебя";
  }
  if (step === "ration") {
    return "Еда на день";
  }
  if (step === "lifts") {
    return "Сила";
  }
  if (step === "circle") {
    if (shelf === "home") {
      return "Дома";
    }
    return shelf === "all" ? "Выбери программу" : "Программа";
  }
  return "Кратко";
}

function subtitleForStep(
  step: OnboardingStep,
  replay: boolean,
  pendingKind: string | null,
  pendingProgramId: unknown,
): string | null {
  if (step === "profile") {
    return profileStepSubtitle(
      replay,
      pendingKind === "workouts" || pendingProgramId != null,
    );
  }
  if (step === "ration") {
    return "Шаблон продуктов на каждый день.";
  }
  if (step === "lifts") {
    return "Для расчёта весов в программе.";
  }
  if (step === "circle") {
    return "Можно сменить и править дни позже в Тренировках.";
  }
  return null;
}
