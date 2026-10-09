"use client";

import { useEffect, useState } from "react";

import { GuideTour } from "@/components/guide/guide-tour";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import {
  OnboardingCircleStep,
  type OnboardingProgramShelf,
} from "@/components/onboarding/onboarding-circle-step";
import {
  OnboardingGoalStep,
  OnboardingMacrosSummary,
  OnboardingSexStep,
  OnboardingTrainingAgeStep,
  OnboardingWeightStep,
  profileStepSubtitle,
} from "@/components/onboarding/onboarding-food-step";
import { OnboardingModeStep } from "@/components/onboarding/onboarding-mode-step";
import { OnboardingLiftsStep } from "@/components/onboarding/onboarding-lifts-step";
import { OnboardingRationStep } from "@/components/onboarding/onboarding-ration-step";
import {
  OnboardingStepDots,
  OnboardingStepShell,
} from "@/components/onboarding/onboarding-shell";
import {
  type OnboardingStep,
  isOnboardingPersonStep,
  onboardingSetupSteps,
  onboardingStepNeedsNext,
} from "@/components/onboarding/onboarding-steps";
import {
  GOAL_REQUIRED,
  SEX_REQUIRED,
  TRAINING_AGE_REQUIRED,
  useOnboardingScreen,
  MODE_REQUIRED,
  RATION_REQUIRED,
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
    gymEnabled,
    foodOnly,
    onGymModePick,
    lifts,
    circle,
    setCircle,
    goBack,
    goNext,
    pickSelfRation,
    rationSelfSetup,
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

  if (step === "mode") {
    return (
      <OnboardingStepShell
        canGoBack={false}
        onBack={() => {}}
        progressLabel="С чего начнём"
        title="Что ведём"
        subtitle="Можно сменить в настройках — данные никуда не пропадут."
        showSticky={false}
        sticky={null}
      >
        <p className="mb-3 text-base text-muted-foreground">
          Выбери один вариант — от этого зависит, что настроим дальше.
        </p>
        <OnboardingModeStep
          gymEnabled={gymEnabled}
          invalid={error === MODE_REQUIRED}
          onPick={onGymModePick}
        />
        {error ? (
          <p className="mt-2 text-center text-base leading-snug text-destructive">{error}</p>
        ) : null}
      </OnboardingStepShell>
    );
  }

  if (step === "guide") {
    return (
      <GuideTour
        gymEnabled={gymEnabled === true}
        allowBackToPreviousStep
        onBackToPreviousStep={goBack}
        error={error}
        onDone={goNext}
        onSkip={goNext}
      />
    );
  }

  const setupSteps = onboardingSetupSteps(steps);
  const setupIndex = Math.max(0, setupSteps.indexOf(step));
  const showNext =
    step === "circle" ? pickingProgram : onboardingStepNeedsNext(step);
  const canLeaveStep = stepIndex > 0 || pickingProgram;
  const weightFieldError =
    error === WEIGHT_REQUIRED || error === WEIGHT_INVALID;

  function showPersonError(stepId: OnboardingStep): boolean {
    if (!error || !isOnboardingPersonStep(stepId)) {
      return false;
    }
    if (stepId === "sex") {
      return error === SEX_REQUIRED;
    }
    if (stepId === "weight") {
      return error === WEIGHT_REQUIRED || error === WEIGHT_INVALID;
    }
    if (stepId === "goal") {
      return error === GOAL_REQUIRED;
    }
    if (stepId === "training_age") {
      return error === TRAINING_AGE_REQUIRED;
    }
    return false;
  }

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
      {step === "sex" ? (
        <>
          <OnboardingSexStep
            sex={sex}
            showLabel={false}
            onPick={onSexPick}
          />
          {showPersonError("sex") ? (
            <p className="mt-2 text-center text-base leading-snug text-destructive">
              {error}
            </p>
          ) : null}
        </>
      ) : null}

      {step === "weight" && sex != null ? (
        <>
          <OnboardingWeightStep
            sex={sex}
            weight={weight}
            invalid={weightInvalid}
            message={weightFieldError ? error : null}
            showLabel={false}
            onChange={onWeightChange}
          />
        </>
      ) : null}

      {step === "goal" ? (
        <>
          <OnboardingGoalStep goal={goal} onPick={onGoalPick} />
          {showPersonError("goal") ? (
            <p className="mt-2 text-center text-base leading-snug text-destructive">
              {error}
            </p>
          ) : null}
        </>
      ) : null}

      {step === "training_age" ? (
        <>
          <OnboardingTrainingAgeStep
            trainingAge={trainingAge}
            onPick={onTrainingAgePick}
          />
          {showPersonError("training_age") ? (
            <p className="mt-2 text-center text-base leading-snug text-destructive">
              {error}
            </p>
          ) : null}
        </>
      ) : null}

      {step === "macros" && sex != null && goal != null ? (
        <OnboardingMacrosSummary
          sex={sex}
          weight={weight}
          goal={goal}
          foodOnly={foodOnly}
        />
      ) : null}

      {step === "ration" ? (
        <>
          <OnboardingRationStep
            ration={ration}
            selfSetup={rationSelfSetup}
            invalid={error === RATION_REQUIRED}
            sex={sex}
            weight={weight}
            goal={goal}
            onPickSelfSetup={pickSelfRation}
            onPick={onRationPick}
          />
          {error === RATION_REQUIRED ? (
            <p className="mt-2 text-center text-base leading-snug text-destructive">{error}</p>
          ) : null}
        </>
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
          onBeginner={() =>
            void goNext({ circleOverride: RECOMMENDED_PROGRAM_PRESET_ID })
          }
          onHome={() => {
            setProgramShelf("home");
            if (sex === "female" && !isProgramPresetId(circle)) {
              setCircle("home_glutes");
            }
          }}
          onPickYourself={() => setProgramShelf("all")}
        />
      ) : null}

      {error &&
      !isOnboardingPersonStep(step) &&
      step !== "ration" &&
      step !== "mode" ? (
        <p className="mt-2 text-center text-base leading-snug text-destructive">
          {error}
        </p>
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
  if (step === "guide") {
    return "О чём это приложение";
  }
  if (step === "mode") {
    return "Что ведём";
  }
  if (step === "sex") {
    return "Пол";
  }
  if (step === "weight") {
    return "Вес";
  }
  if (step === "goal") {
    return "Цель";
  }
  if (step === "training_age") {
    return "Стаж в зале";
  }
  if (step === "macros") {
    return "Твои цели";
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
  return "О чём это приложение";
}

function subtitleForStep(
  step: OnboardingStep,
  replay: boolean,
  pendingKind: string | null,
  pendingProgramId: unknown,
): string | null {
  if (step === "sex") {
    return (
      profileStepSubtitle(
        replay,
        pendingKind === "workouts" || pendingProgramId != null,
      ) ?? "Для расчёта белка и калорий."
    );
  }
  if (step === "weight") {
    return "Свайпни линейку. Потом можно менять в дневнике.";
  }
  if (step === "goal") {
    return "От этого зависят калории и белок.";
  }
  if (step === "training_age") {
    return "Чтобы стартовые веса в программе были реалистичными.";
  }
  if (step === "macros") {
    return "Позже всё можно подправить в настройках.";
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
