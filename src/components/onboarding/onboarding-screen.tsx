"use client";

import { ChevronLeft } from "lucide-react";

import { GuideTour } from "@/components/guide/guide-tour";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import { OnboardingCircleStep } from "@/components/onboarding/onboarding-circle-step";
import {
  OnboardingGoalStep,
  OnboardingMacrosStep,
  OnboardingSexStep,
  OnboardingTrainingAgeStep,
  OnboardingWeightStep,
} from "@/components/onboarding/onboarding-food-step";
import { OnboardingLiftsStep } from "@/components/onboarding/onboarding-lifts-step";
import {
  type OnboardingStep,
  onboardingStepNeedsNext,
} from "@/components/onboarding/onboarding-steps";
import { useOnboardingScreen } from "@/components/onboarding/use-onboarding-screen";
import { Button } from "@/components/ui/button";
import { GUIDE_LABEL } from "@/lib/guide";
import { LOAD_FAILED } from "@/lib/messages";
import { cn } from "@/lib/utils";

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
    proteinOverride,
    lifts,
    circle,
    setCircle,
    goBack,
    goNext,
    weightInvalid,
    proteinInvalid,
    onSexPick,
    onWeightChange,
    onGoalPick,
    onTrainingAgePick,
    onLiftChange,
    onProteinOverride,
  } = useOnboardingScreen();

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

  const showNext = onboardingStepNeedsNext(step);

  return (
    <div className={cn("flex flex-col gap-4", showNext ? "pb-44" : "pb-8")}>
      {stepIndex > 0 ? <TelegramBackButton onBack={goBack} /> : null}
      <header className="flex items-center gap-2 px-4 py-4">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 motion-reduce:transition-none"
            aria-label="Назад"
            onClick={goBack}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <StepDots
            steps={steps.filter((id) => id !== "guide")}
            current={step}
          />
          <h1
            key={step}
            className="mt-1 truncate text-2xl font-semibold tracking-tight animate-fade"
          >
            {titleForStep(step)}
          </h1>
        </div>
      </header>

      <div key={step} className="flex flex-col gap-4 px-4">
        {step === "sex" ? (
          <OnboardingSexStep
            sex={sex}
            replay={replay}
            fromWorkoutPack={
              pendingKind === "workouts" || pendingProgramId != null
            }
            onPick={onSexPick}
          />
        ) : null}

        {step === "weight" ? (
          <OnboardingWeightStep
            weight={weight}
            invalid={weightInvalid}
            message={weightInvalid ? error : null}
            onChange={onWeightChange}
          />
        ) : null}

        {step === "goal" ? (
          <OnboardingGoalStep goal={goal} onPick={onGoalPick} />
        ) : null}

        {step === "training_age" ? (
          <OnboardingTrainingAgeStep
            trainingAge={trainingAge}
            onPick={onTrainingAgePick}
          />
        ) : null}

        {step === "macros" ? (
          <OnboardingMacrosStep
            sex={sex}
            weight={weight}
            goal={goal}
            proteinOverride={proteinOverride}
            proteinInvalid={proteinInvalid}
            onProteinOverride={onProteinOverride}
          />
        ) : null}

        {step === "lifts" ? (
          <OnboardingLiftsStep answers={lifts} onChange={onLiftChange} />
        ) : null}

        {step === "circle" ? (
          <OnboardingCircleStep
            value={circle}
            fromMealPack={pendingKind === "meals"}
            onChange={setCircle}
          />
        ) : null}

        {error && step !== "weight" ? (
          <p className="animate-rise text-center text-base text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      {showNext ? (
        <StickyActions withNav={false}>
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
    <div className="flex items-center gap-1.5" aria-hidden>
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

function titleForStep(step: OnboardingStep): string {
  if (step === "sex") {
    return "Кто ты";
  }
  if (step === "weight") {
    return "Вес, кг";
  }
  if (step === "goal") {
    return "Цель";
  }
  if (step === "training_age") {
    return "Стаж";
  }
  if (step === "macros") {
    return "Твои цифры";
  }
  if (step === "lifts") {
    return "Сила";
  }
  if (step === "circle") {
    return "Программа тренировок";
  }
  return GUIDE_LABEL;
}
