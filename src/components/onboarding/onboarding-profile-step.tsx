"use client";

import { OnboardingPrimaryAction } from "@/components/onboarding/onboarding-step-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import {
  ONBOARDING_ACTIVITY_OPTIONS,
  ONBOARDING_PACE_OPTIONS,
  paceHint,
} from "@/lib/nutrition/profile-energy";
import type { OnboardingGoal } from "@/lib/nutrition/suggest-protein";
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
  heightCm,
  birthYear,
  onHeightChange,
  onBirthYearChange,
  saving,
  onContinue,
  onSkip,
}: {
  heightCm: string;
  birthYear: string;
  onHeightChange: (value: string) => void;
  onBirthYearChange: (value: string) => void;
  saving?: boolean;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted-foreground">
        Рост и возраст точнее посчитают калории. Можно пропустить — возьмём вес
        и активность.
      </p>
      <div className="flex flex-col gap-2">
        <Label className="text-base">Рост, см</Label>
        <input
          type="text"
          inputMode="decimal"
          className="field-control h-12 rounded-xl border border-input/70 bg-input-bg px-3 text-base"
          value={heightCm}
          placeholder="175"
          onChange={(event) =>
            onHeightChange(sanitizeDecimalDraft(event.target.value))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-base">Год рождения</Label>
        <input
          type="text"
          inputMode="numeric"
          className="field-control h-12 rounded-xl border border-input/70 bg-input-bg px-3 text-base"
          value={birthYear}
          placeholder="1990"
          maxLength={4}
          onChange={(event) =>
            onBirthYearChange(event.target.value.replace(/\D/g, "").slice(0, 4))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <OnboardingPrimaryAction saving={saving} onClick={onContinue} />
        <Button
          type="button"
          variant="ghost"
          className="h-12 text-base text-muted-foreground"
          disabled={saving}
          onClick={onSkip}
        >
          Пропустить
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
