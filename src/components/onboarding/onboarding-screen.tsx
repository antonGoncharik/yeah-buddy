"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { GuideTour } from "@/components/guide/guide-tour";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import {
  OnboardingCircleStep,
  type OnboardingProgramShelf,
} from "@/components/onboarding/onboarding-circle-step";
import { OnboardingProfileStep } from "@/components/onboarding/onboarding-food-step";
import { OnboardingLiftsStep } from "@/components/onboarding/onboarding-lifts-step";
import { OnboardingRationStep } from "@/components/onboarding/onboarding-ration-step";
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
import { GUIDE_LABEL } from "@/lib/guide";
import { LOAD_FAILED } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { RECOMMENDED_PROGRAM_PRESET_ID } from "@/lib/workout/program-presets";

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
      <main className="app-viewport-min flex flex-col justify-center px-4">
        <ScreenLoading />
      </main>
    );
  }

  if (!state) {
    return (
      <main className="app-viewport-min flex flex-col justify-center px-4">
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

  return (
    <div className={cn("flex flex-col gap-4", showNext ? "pb-44" : "pb-8")}>
      {canLeaveStep ? <TelegramBackButton onBack={handleBack} /> : null}
      <header className="flex items-center gap-2 px-4 py-4">
        {canLeaveStep ? (
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 motion-reduce:transition-none"
            aria-label="Назад"
            onClick={handleBack}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">
            Настройка {setupIndex + 1} из {setupSteps.length}
          </p>
          <StepDots steps={setupSteps} current={step} />
          <h1
            key={step}
            className="mt-1 truncate text-2xl font-semibold tracking-tight animate-fade"
          >
            {titleForStep(step, programShelf)}
          </h1>
        </div>
      </header>

      <div key={step} className="flex flex-col gap-4 px-4">
        {step === "profile" ? (
          <OnboardingProfileStep
            sex={sex}
            weight={weight}
            goal={goal}
            trainingAge={trainingAge}
            weightInvalid={weightInvalid}
            weightMessage={weightFieldError ? error : null}
            replay={replay}
            fromWorkoutPack={
              pendingKind === "workouts" || pendingProgramId != null
            }
            onSexPick={onSexPick}
            onWeightChange={onWeightChange}
            onGoalPick={onGoalPick}
            onTrainingAgePick={onTrainingAgePick}
          />
        ) : null}
        {error && step === "profile" && profileFieldError ? (
          <p className="text-center text-base text-destructive">{error}</p>
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
            onChange={setCircle}
            onBeginner={() => void goNext(RECOMMENDED_PROGRAM_PRESET_ID)}
            onHome={() => setProgramShelf("home")}
            onPickYourself={() => setProgramShelf("all")}
          />
        ) : null}

        {error && step !== "profile" ? (
          <p className="animate-rise text-center text-base text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      {showNext ? (
        <StickyActions withNav={false}>
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
            onClick={() => void goNext()}
          >
            {saving ? "Секунду…" : isLast ? "Готово" : "Дальше"}
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}

function StepDots({
  steps,
  current,
}: {
  steps: OnboardingStep[];
  current: OnboardingStep;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5" aria-hidden>
      {steps.map((id) => (
        <span
          key={id}
          className={cn(
            "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
            id === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/35",
          )}
        />
      ))}
    </div>
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
    return shelf === "all" ? "Выбери программу" : "Программа тренировок";
  }
  return GUIDE_LABEL;
}
