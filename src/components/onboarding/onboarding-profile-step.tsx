"use client";

import { useState } from "react";

import { OnboardingPrimaryAction } from "@/components/onboarding/onboarding-step-actions";
import { TickRuler } from "@/components/onboarding/tick-ruler";
import { Button } from "@/components/ui/button";
import {
  ageYearsLabel,
  BODY_HEIGHT_MAX_CM,
  BODY_HEIGHT_MIN_CM,
  birthYearFromAge,
  profileAgeBounds,
  profileAgeYears,
  profileHeightCm,
} from "@/lib/nutrition/body-profile";
import {
  ONBOARDING_ACTIVITY_OPTIONS,
  ONBOARDING_PACE_OPTIONS,
  paceHint,
} from "@/lib/nutrition/profile-energy";
import type {
  OnboardingGoal,
  OnboardingSex,
} from "@/lib/nutrition/suggest-protein";
import { haptic } from "@/lib/telegram/haptic";
import type { UserActivityLevel, UserGoalPace } from "@/lib/types";

export function OnboardingActivityStep({
  activity,
  onPick,
}: {
  activity: UserActivityLevel | null;
  onPick: (value: UserActivityLevel) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {ONBOARDING_ACTIVITY_OPTIONS.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant={activity === option.id ? "default" : "outline"}
          className="h-auto min-h-14 flex-col items-start gap-0.5 py-3 text-left"
          onClick={() => {
            if (activity !== option.id) {
              haptic("tick");
            } else {
              haptic("tap");
            }
            onPick(option.id);
          }}
        >
          <span className="text-base font-medium">{option.label}</span>
          <span className="text-sm font-normal opacity-80">{option.hint}</span>
        </Button>
      ))}
    </div>
  );
}

export function OnboardingBodyProfileStep({
  sex,
  heightCm,
  birthYear,
  saving,
  message,
  onConfirm,
  onSkip,
}: {
  sex: OnboardingSex | null;
  heightCm: string;
  birthYear: string;
  saving?: boolean;
  message?: string | null;
  onConfirm: (heightCm: string, birthYear: string) => void;
  onSkip: () => void;
}) {
  const nowYear = new Date().getFullYear();
  const [height, setHeight] = useState(() => profileHeightCm(heightCm, sex));
  const [age, setAge] = useState(() => profileAgeYears(birthYear, nowYear));
  const ages = profileAgeBounds(nowYear);

  function confirm() {
    const year = birthYearFromAge(age, nowYear);
    if (year == null) {
      return;
    }
    onConfirm(String(height), String(year));
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4">
        <TickRuler
          compact
          label="Рост"
          min={BODY_HEIGHT_MIN_CM}
          max={BODY_HEIGHT_MAX_CM}
          value={height}
          unit="см"
          ariaLabel="Рост в сантиметрах"
          onChange={setHeight}
        />
        <TickRuler
          compact
          label="Возраст"
          min={ages.min}
          max={ages.max}
          value={age}
          unit={ageYearsLabel}
          ariaLabel="Возраст"
          onChange={setAge}
        />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        {message ? (
          <p className="text-center text-base leading-snug text-destructive">
            {message}
          </p>
        ) : null}
        <OnboardingPrimaryAction saving={saving} onClick={confirm} />
        <Button
          type="button"
          variant="ghost"
          className="h-12 text-base text-muted-foreground"
          disabled={saving}
          onClick={onSkip}
        >
          Не указывать
        </Button>
      </div>
    </div>
  );
}

export function OnboardingGoalPaceStep({
  goal,
  pace,
  onPick,
}: {
  goal: OnboardingGoal;
  pace: UserGoalPace | null;
  onPick: (value: UserGoalPace) => void;
}) {
  if (goal === "keep") {
    return (
      <p className="text-base text-muted-foreground">
        На балансе темп сушки и набора не нужен — держим вес стабильным.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {goal === "lose" ? "Как быстро сушим?" : "Как быстро набираем?"}
      </p>
      {ONBOARDING_PACE_OPTIONS.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant={pace === option.id ? "default" : "outline"}
          className="h-auto min-h-14 flex-col items-start gap-0.5 py-3 text-left"
          onClick={() => {
            if (pace !== option.id) {
              haptic("tick");
            } else {
              haptic("tap");
            }
            onPick(option.id);
          }}
        >
          <span className="text-base font-medium">{option.label}</span>
          <span className="text-sm font-normal opacity-80">
            {paceHint(goal, option.id)}
          </span>
        </Button>
      ))}
    </div>
  );
}
