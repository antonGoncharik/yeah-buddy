"use client";

import { useEffect, useState } from "react";

import { GuidePageBody } from "@/components/guide/guide-page-body";
import { OnboardingPrimaryAction } from "@/components/onboarding/onboarding-step-actions";
import {
  OnboardingStepShell,
  OnboardingThumbZone,
} from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { GUIDE_LABEL, onboardingIntroPages } from "@/lib/guide";
import type { GuidePage } from "@/lib/guide/types";
import { haptic } from "@/lib/telegram/haptic";

export function GuideTour({
  gymEnabled = true,
  pages,
  pageIndex,
  onPageIndexChange,
  allowBackToPreviousStep = false,
  onRetreat,
  error = null,
  onDone,
  onSkip,
}: {
  gymEnabled?: boolean;
  pages?: GuidePage[];
  pageIndex?: number;
  onPageIndexChange?: (index: number) => void;
  allowBackToPreviousStep?: boolean;
  onRetreat?: () => void;
  error?: string | null;
  onDone: () => void;
  onSkip: () => void;
}) {
  const introPages = pages ?? onboardingIntroPages(gymEnabled);
  const [internalIndex, setInternalIndex] = useState(0);
  const index = pageIndex ?? internalIndex;
  const setIndex = onPageIndexChange ?? setInternalIndex;
  const page = introPages[index] ?? introPages[0];
  const last = index === introPages.length - 1;
  const canBack = index > 0 || allowBackToPreviousStep;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!page) {
    return null;
  }

  function showPage(next: number) {
    setIndex(next);
    window.scrollTo(0, 0);
  }

  function goNext() {
    haptic("tick");
    if (last) {
      onDone();
      return;
    }
    showPage(index + 1);
  }

  function handleBack() {
    if (!canBack || !onRetreat) {
      return;
    }
    haptic("tap");
    onRetreat();
  }

  return (
    <OnboardingStepShell
      canGoBack={canBack || allowBackToPreviousStep}
      onBack={handleBack}
      progressLabel={
        introPages.length > 1 ? `${index + 1} из ${introPages.length}` : null
      }
      title={page.title}
      subtitle={null}
      showSticky={false}
      sticky={null}
    >
      <OnboardingThumbZone>
        <section className="card-surface flex flex-col gap-4 px-5 py-5">
          <GuidePageBody page={page} showDoodle={false} />
        </section>
        {last ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {`Подробнее — в Настройках → «${GUIDE_LABEL}».`}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {last ? null : (
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full text-base"
              data-keyboard-secondary
              onClick={() => {
                haptic("tap");
                onSkip();
              }}
            >
              Пропустить
            </Button>
          )}
          <OnboardingPrimaryAction
            label={last ? "К настройке" : "Дальше"}
            onClick={goNext}
          />
        </div>
        {error ? (
          <p className="mt-3 text-center text-base leading-snug text-destructive">
            {error}
          </p>
        ) : null}
      </OnboardingThumbZone>
    </OnboardingStepShell>
  );
}
