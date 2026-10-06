"use client";

import { useEffect, useState } from "react";

import { GuidePageBody } from "@/components/guide/guide-page-body";
import { OnboardingStepShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { GUIDE_INTRO_PAGES, GUIDE_LABEL } from "@/lib/guide";
import { haptic } from "@/lib/telegram/haptic";

export function GuideTour({
  error = null,
  onDone,
  onSkip,
}: {
  error?: string | null;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [index, setIndex] = useState(0);
  const page = GUIDE_INTRO_PAGES[index] ?? GUIDE_INTRO_PAGES[0];
  const last = index === GUIDE_INTRO_PAGES.length - 1;
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

  return (
    <OnboardingStepShell
      canGoBack={canBack}
      onBack={goBack}
      progressLabel={`${index + 1} из ${GUIDE_INTRO_PAGES.length}`}
      title={page.title}
      subtitle={page.lead}
      showSticky
      sticky={
        <>
          {last ? null : (
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full text-sm"
              data-keyboard-secondary
              onClick={() => {
                haptic("tap");
                onSkip();
              }}
            >
              Пропустить
            </Button>
          )}
          <Button className="h-12 w-full text-lg" onClick={goNext}>
            {last ? "К настройке" : "Дальше"}
          </Button>
        </>
      }
    >
      <section className="card-surface px-4 py-3">
        <GuidePageBody page={page} omitLead compact />
      </section>
      {last ? (
        <p className="mt-3 text-xs leading-snug text-muted-foreground">
          {`Подробнее — в Настройках → «${GUIDE_LABEL}».`}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      ) : null}
    </OnboardingStepShell>
  );
}
