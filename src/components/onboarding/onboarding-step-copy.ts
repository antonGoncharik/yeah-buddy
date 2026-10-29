import type { OnboardingProgramShelf } from "@/components/onboarding/onboarding-circle-step";
import { profileStepSubtitle } from "@/components/onboarding/onboarding-food-step";
import {
  ACTIVITY_REQUIRED,
  GOAL_REQUIRED,
  MODE_REQUIRED,
  PACE_REQUIRED,
  RATION_REQUIRED,
  SEX_REQUIRED,
  TRAINING_AGE_REQUIRED,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-messages";
import {
  isOnboardingPersonStep,
  type OnboardingStep,
} from "@/components/onboarding/onboarding-steps";

export {
  ACTIVITY_REQUIRED,
  GOAL_REQUIRED,
  MODE_REQUIRED,
  PACE_REQUIRED,
  RATION_REQUIRED,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
};

export function onboardingStepTitle(
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
  if (step === "activity") {
    return "Активность";
  }
  if (step === "profile") {
    return "Рост и возраст";
  }
  if (step === "goal") {
    return "Цель";
  }
  if (step === "pace") {
    return "Темп";
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

export function onboardingStepSubtitle(
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
  if (step === "profile") {
    return "Свайпни линейки — калории будут точнее. Можно не указывать.";
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

export function onboardingPersonStepError(
  stepId: OnboardingStep,
  error: string | null,
): boolean {
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
