"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import type { OnboardingStep } from "@/components/onboarding/onboarding-steps";
import { cn } from "@/lib/utils";

export function OnboardingStepShell({
  canGoBack,
  onBack,
  progressLabel,
  stepDots,
  title,
  subtitle,
  showSticky,
  sticky,
  children,
}: {
  canGoBack: boolean;
  onBack: () => void;
  progressLabel: string;
  stepDots?: ReactNode;
  title: string;
  subtitle?: string | null;
  showSticky: boolean;
  sticky: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[var(--app-viewport-height)] min-h-0 flex-col">
      {canGoBack ? <TelegramBackButton onBack={onBack} /> : null}
      <header className="shrink-0 px-4 py-3">
        <div className="flex items-start gap-2">
          {canGoBack ? (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 motion-reduce:transition-none"
              aria-label="Назад"
              onClick={onBack}
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{progressLabel}</p>
              {stepDots}
            </div>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-base leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4",
          showSticky ? "pb-44" : "pb-4",
        )}
      >
        {children}
      </div>

      {showSticky ? (
        <StickyActions withNav={false}>{sticky}</StickyActions>
      ) : null}
    </div>
  );
}

export function OnboardingStepDots({
  steps,
  current,
}: {
  steps: OnboardingStep[];
  current: OnboardingStep;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1" aria-hidden>
      {steps.map((id) => (
        <span
          key={id}
          className={cn(
            "h-1 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
            id === current ? "w-4 bg-primary" : "w-1 bg-muted-foreground/35",
          )}
        />
      ))}
    </div>
  );
}
