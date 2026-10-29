"use client";

import type { ReactNode } from "react";

import { GuideTour } from "@/components/guide/guide-tour";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { OnboardingCircleStep } from "@/components/onboarding/onboarding-circle-step";
import {
  OnboardingGoalStep,
  OnboardingMacrosSummary,
  OnboardingSexStep,
  OnboardingTrainingAgeStep,
  OnboardingWeightStep,
} from "@/components/onboarding/onboarding-food-step";
import { OnboardingLiftsStep } from "@/components/onboarding/onboarding-lifts-step";
import { OnboardingModeStep } from "@/components/onboarding/onboarding-mode-step";
import {
  OnboardingActivityStep,
  OnboardingBodyProfileStep,
  OnboardingGoalPaceStep,
} from "@/components/onboarding/onboarding-profile-step";
import { OnboardingRationStep } from "@/components/onboarding/onboarding-ration-step";
import {
  OnboardingStepDots,
  OnboardingStepShell,
  OnboardingThumbZone,
} from "@/components/onboarding/onboarding-shell";
import {
  ACTIVITY_REQUIRED,
  MODE_REQUIRED,
  onboardingPersonStepError,
  onboardingStepSubtitle,
  onboardingStepTitle,
  PACE_REQUIRED,
  RATION_REQUIRED,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-step-copy";
import {
  isOnboardingPersonStep,
  type OnboardingStep,
  onboardingSetupSteps,
  onboardingStepNeedsNext,
} from "@/components/onboarding/onboarding-steps";
import { useOnboardingScreen } from "@/components/onboarding/use-onboarding-screen";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED } from "@/lib/messages";
import { programForTrainingAge } from "@/lib/onboarding/setup";
import { parseDecimal } from "@/lib/workout/numbers";
import { isProgramPresetId } from "@/lib/workout/program-presets";

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
    activity,
    goalPace,
    heightCm,
    birthYear,
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
    finishDiary,
    weightInvalid,
    onSexPick,
    onWeightChange,
    onGoalPick,
    onTrainingAgePick,
    onActivityPick,
    onGoalPacePick,
    skipProfile,
    confirmProfile,
    onLiftChange,
    onRationPick,
    guidePageIndex,
    setGuidePageIndex,
    programShelf,
    setProgramShelf,
  } = useOnboardingScreen();
  const pickingProgram = programShelf != null;

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
        <OnboardingThumbZone>
          <p className="mb-3 text-base text-muted-foreground">
            Выбери один вариант — от этого зависит, что настроим дальше.
          </p>
          <OnboardingModeStep
            gymEnabled={gymEnabled}
            invalid={error === MODE_REQUIRED}
            onPick={onGymModePick}
          />
          {error ? (
            <p className="mt-2 text-center text-base leading-snug text-destructive">
              {error}
            </p>
          ) : null}
        </OnboardingThumbZone>
      </OnboardingStepShell>
    );
  }

  if (step === "guide") {
    return (
      <GuideTour
        gymEnabled={gymEnabled === true}
        pageIndex={guidePageIndex}
        onPageIndexChange={setGuidePageIndex}
        allowBackToPreviousStep
        onRetreat={goBack}
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
    return onboardingPersonStepError(stepId, error);
  }

  function handleBack() {
    goBack();
  }

  return (
    <>
      <OnboardingStepShell
        canGoBack={canLeaveStep}
        onBack={handleBack}
        progressLabel={`Настройка ${setupIndex + 1} из ${setupSteps.length}`}
        stepDots={<OnboardingStepDots steps={setupSteps} current={step} />}
        title={onboardingStepTitle(step, programShelf)}
        subtitle={onboardingStepSubtitle(
          step,
          replay,
          pendingKind,
          pendingProgramId,
        )}
        showSticky={showNext}
        sticky={
          showNext ? (
            <Button
              className="h-14 w-full text-lg"
              disabled={saving}
              onClick={() => void goNext()}
            >
              {saving ? "Секунду…" : isLast ? "Готово" : "Дальше"}
            </Button>
          ) : null
        }
      >
        {step === "sex" ? (
          <OnboardingThumbZone>
            <OnboardingSexStep sex={sex} showLabel={false} onPick={onSexPick} />
            {showPersonError("sex") ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "weight" && sex != null ? (
          <OnboardingWeightStep
            sex={sex}
            weight={weight}
            invalid={weightInvalid}
            message={weightFieldError ? error : null}
            showLabel={false}
            saving={saving}
            onContinue={() => void goNext()}
            onChange={onWeightChange}
          />
        ) : null}

        {step === "activity" ? (
          <OnboardingThumbZone>
            <OnboardingActivityStep
              activity={activity}
              onPick={onActivityPick}
            />
            {error === ACTIVITY_REQUIRED ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "profile" ? (
          <OnboardingBodyProfileStep
            sex={sex}
            heightCm={heightCm}
            birthYear={birthYear}
            saving={saving}
            message={error}
            onConfirm={confirmProfile}
            onSkip={skipProfile}
          />
        ) : null}

        {step === "goal" ? (
          <OnboardingThumbZone>
            <OnboardingGoalStep goal={goal} onPick={onGoalPick} />
            {showPersonError("goal") ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "pace" && goal != null ? (
          <OnboardingThumbZone>
            <OnboardingGoalPaceStep
              goal={goal}
              pace={goalPace}
              onPick={onGoalPacePick}
            />
            {error === PACE_REQUIRED ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "training_age" ? (
          <OnboardingThumbZone>
            <OnboardingTrainingAgeStep
              trainingAge={trainingAge}
              onPick={onTrainingAgePick}
            />
            {showPersonError("training_age") ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "macros" && sex != null && goal != null ? (
          <OnboardingMacrosSummary
            sex={sex}
            weight={weight}
            goal={goal}
            activity={activity}
            goalPace={goalPace}
            heightCm={heightCm}
            birthYear={birthYear}
            foodOnly={foodOnly}
            saving={saving}
            isLast={isLast}
            canEnterDiary={!replay && !isLast}
            onContinue={() => void goNext()}
            onEnterDiary={() => finishDiary()}
          />
        ) : null}

        {step === "ration" ? (
          <OnboardingThumbZone>
            <OnboardingRationStep
              ration={ration}
              selfSetup={rationSelfSetup}
              invalid={error === RATION_REQUIRED}
              sex={sex}
              weight={weight}
              goal={goal}
              activity={activity}
              goalPace={goalPace}
              heightCm={heightCm}
              birthYear={birthYear}
              onPickSelfSetup={pickSelfRation}
              onPick={onRationPick}
            />
            {error === RATION_REQUIRED ? (
              <p className="mt-2 text-center text-base leading-snug text-destructive">
                {error}
              </p>
            ) : null}
          </OnboardingThumbZone>
        ) : null}

        {step === "lifts" ? (
          <OnboardingLiftsStep
            answers={lifts}
            sex={sex}
            trainingAge={trainingAge}
            bodyWeightKg={parseDecimal(weight)}
            saving={saving}
            isLast={isLast}
            onChange={onLiftChange}
            onConfirm={() => void confirmLifts()}
            onSkip={() => skipLifts()}
          />
        ) : null}

        {step === "circle" ? (
          <CircleStepLayout thumb={!pickingProgram}>
            <OnboardingCircleStep
              value={circle}
              fromMealPack={pendingKind === "meals"}
              picking={pickingProgram}
              shelf={programShelf}
              saving={saving}
              sex={sex}
              onChange={setCircle}
              trainingAge={trainingAge}
              onBeginner={() =>
                void goNext({
                  circleOverride: programForTrainingAge(trainingAge),
                })
              }
              onHome={() => {
                setProgramShelf("home");
                if (sex === "female" && !isProgramPresetId(circle)) {
                  setCircle("home_glutes");
                }
              }}
              onPickYourself={() => setProgramShelf("all")}
            />
          </CircleStepLayout>
        ) : null}

        {error && !isOnboardingPersonStep(step) && step !== "ration" ? (
          <p className="mt-2 text-center text-base leading-snug text-destructive">
            {error}
          </p>
        ) : null}
      </OnboardingStepShell>
      {saving ? <ScreenLoading cover title="Сохраняем настройки…" /> : null}
    </>
  );
}

function CircleStepLayout({
  thumb,
  children,
}: {
  thumb: boolean;
  children: ReactNode;
}) {
  if (thumb) {
    return <OnboardingThumbZone>{children}</OnboardingThumbZone>;
  }
  return children;
}
