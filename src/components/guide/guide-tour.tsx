"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { GuidePageBody } from "@/components/guide/guide-page-body";
import { StickyActions } from "@/components/layout/sticky-actions";
import { TelegramBackButton } from "@/components/layout/telegram-back-button";
import { Button } from "@/components/ui/button";
import { GUIDE_LABEL, GUIDE_PAGES } from "@/lib/guide";
import { haptic } from "@/lib/telegram/haptic";

export function GuideTour({
  mode,
  saving = false,
  error = null,
  onBackFromStart,
  onDone,
  onSkip,
}: {
  mode: "onboarding" | "settings";
  saving?: boolean;
  error?: string | null;
  onBackFromStart?: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [index, setIndex] = useState(0);
  const page = GUIDE_PAGES[index] ?? GUIDE_PAGES[0];
  const last = index === GUIDE_PAGES.length - 1;
  const canBack = index > 0 || Boolean(onBackFromStart);

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
      return;
    }
    onBackFromStart?.();
  }

  function goNext() {
    if (last) {
      haptic(mode === "settings" ? "success" : "tick");
      onDone();
      return;
    }
    haptic("tick");
    showPage(index + 1);
  }

  return (
    <div className="flex flex-col gap-4 pb-44">
      {canBack ? <TelegramBackButton onBack={goBack} /> : null}
      <header className="flex items-center gap-2 px-4 py-4">
        {canBack ? (
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
          <p className="text-sm text-muted-foreground">
            {index + 1} из {GUIDE_PAGES.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none"
              style={{
                width: `${((index + 1) / GUIDE_PAGES.length) * 100}%`,
              }}
            />
          </div>
          <h1
            key={page.id}
            className="mt-2 truncate text-2xl font-semibold tracking-tight animate-fade"
          >
            {page.title}
          </h1>
        </div>
      </header>

      <div key={page.id} className="px-4">
        <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
          <GuidePageBody page={page} />
        </section>
        {last && mode !== "settings" ? (
          <p className="animate-rise mt-4 px-1 text-base leading-relaxed text-muted-foreground">
            {`Дальше — белок и программа. Этот текст останется в Настройках → «${GUIDE_LABEL}».`}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 text-center text-base text-destructive">{error}</p>
        ) : null}
      </div>

      <StickyActions withNav={false}>
        {last ? null : (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-base"
            disabled={saving}
            data-keyboard-secondary
            onClick={() => {
              haptic("tap");
              onSkip();
            }}
          >
            Пропустить
          </Button>
        )}
        <Button
          className="h-14 w-full text-lg"
          disabled={saving}
          onClick={goNext}
        >
          {saving
            ? "Сохранение…"
            : last
              ? mode === "settings"
                ? "Понятно"
                : "Дальше"
              : "Дальше"}
        </Button>
      </StickyActions>
    </div>
  );
}
