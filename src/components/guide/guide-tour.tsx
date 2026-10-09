"use client";

import { useEffect, useState } from "react";

import { GuidePageBody } from "@/components/guide/guide-page-body";
import { OnboardingStepShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { GUIDE_LABEL, onboardingIntroPages } from "@/lib/guide";
import type { GuidePage } from "@/lib/guide/types";
import { haptic } from "@/lib/telegram/haptic";

export function GuideTour({
  gymEnabled = true,
  pages,
  allowBackToPreviousStep = false,
  onBackToPreviousStep,
  error = null,
  onDone,
  onSkip,
}: {
  gymEnabled?: boolean;
  pages?: GuidePage[];
  allowBackToPreviousStep?: boolean;
  onBackToPreviousStep?: () => void;
  error?: string | null;
  onDone: () => void;
  onSkip: () => void;
}) {
  const introPages = pages ?? onboardingIntroPages(gymEnabled);
  const [index, setIndex] = useState(0);
  const page = introPages[index] ?? introPages[0];
  const last = index === introPages.length - 1;
  const canBack = index > 0;

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

  function goBack() {
    if (index > 0) {
      haptic("tap");
      showPage(index - 1);
    }
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
    if (canBack) {
      goBack();
      return;
    }
    if (allowBackToPreviousStep && onBackToPreviousStep) {
      haptic("tap");
      onBackToPreviousStep();
    }
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
      showSticky
      sticky={
        <>
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
          <Button className="h-14 w-full text-lg" onClick={goNext}>
            {last ? "К настройке" : "Дальше"}
          </Button>
        </>
      }
    >
      <section className="card-surface flex flex-col gap-4 px-5 py-5">
        <GuidePageBody page={page} />
      </section>
      {last ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {`Подробнее — в Настройках → «${GUIDE_LABEL}».`}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-center text-base leading-snug text-destructive">{error}</p>
      ) : null}
    </OnboardingStepShell>
  );
}
