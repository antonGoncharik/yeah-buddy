"use client";

import { ChevronLeft } from "lucide-react";

import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import { OnboardingCircleStep } from "@/components/onboarding/onboarding-circle-step";
import { OnboardingFoodStep } from "@/components/onboarding/onboarding-food-step";
import { OnboardingMaxesStep } from "@/components/onboarding/onboarding-maxes-step";
import {
  type OnboardingStep,
  useOnboardingScreen,
} from "@/components/onboarding/use-onboarding-screen";
import { Button } from "@/components/ui/button";
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
    onProteinChange,
    onMaxChange,
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

  return (
    <div className="flex flex-col gap-4 pb-44">
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
          <StepDots steps={steps} current={step} />
          <h1
            key={step}
            className="mt-1 truncate text-2xl font-semibold tracking-tight animate-fade"
          >
            {titleForStep(step)}
          </h1>
        </div>
      </header>

      <div key={step} className="flex flex-col gap-4 px-4">
        {step === "food" ? (
          <OnboardingFoodStep
            protein={protein}
            preview={preview}
            fromWorkoutPack={pendingKind === "workouts"}
            onProteinChange={onProteinChange}
          />
        ) : null}

        {step === "circle" ? (
          <OnboardingCircleStep
            value={circle}
            fromMealPack={pendingKind === "meals"}
            onChange={setCircle}
          />
        ) : null}

        {step === "maxes" ? (
          <OnboardingMaxesStep
            exercises={weightExercises}
            values={maxInputs}
            onChange={onMaxChange}
          />
        ) : null}

        {error ? (
          <p className="animate-rise text-center text-base text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <StickyActions withNav={false}>
        {step === "food" ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={saving}
            onClick={() => skipFoodStep()}
          >
            Пропустить
          </Button>
        ) : null}
        {step === "maxes" ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={saving}
            onClick={() => void finish({ omitMaxes: true })}
          >
            Пока без весов
          </Button>
        ) : null}
        <Button
          className="h-14 w-full text-lg"
          disabled={saving}
          onClick={() => void goNext()}
        >
          {saving ? "Сохранение…" : isLast ? "Готово" : "Дальше"}
        </Button>
      </StickyActions>
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
  if (step === "food") {
    return "Еда";
  }
  if (step === "circle") {
    return "Зал";
  }
  return "Веса";
}
