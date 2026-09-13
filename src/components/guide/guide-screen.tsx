"use client";

import { useState } from "react";

import { GuidePageBody } from "@/components/guide/guide-page-body";
import { AppHeader } from "@/components/layout/app-header";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { GUIDE_HINT, GUIDE_LABEL, GUIDE_PAGES } from "@/lib/guide";
import { restoreGuideTips } from "@/lib/guide/seen";
import { haptic } from "@/lib/telegram/haptic";

export function GuideScreen() {
  const [restored, setRestored] = useState(false);

  function onRestoreTips() {
    restoreGuideTips();
    haptic("success");
    setRestored(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={GUIDE_LABEL}
        subtitle={GUIDE_HINT}
        backHref="/settings"
      />

      <div className="flex flex-col gap-4 px-4 pb-36">
        <p className="text-base leading-relaxed text-muted-foreground">
          Всё, что нужно знать о дневнике. Читай подряд или выбери раздел.
        </p>

        <nav className="card-surface animate-rise divide-y divide-border/70 px-5 py-1">
          {GUIDE_PAGES.map((page, index) => (
            <button
              key={page.id}
              type="button"
              className="flex w-full items-baseline justify-between gap-3 py-3 text-left"
              onClick={() => {
                haptic("tick");
                document
                  .getElementById(`guide-${page.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="text-lg font-medium">{page.title}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {index + 1}
              </span>
            </button>
          ))}
        </nav>

        {GUIDE_PAGES.map((page, index) => (
          <section
            key={page.id}
            id={`guide-${page.id}`}
            className="card-surface animate-rise flex flex-col gap-4 px-5 py-5"
            style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
          >
            <h2 className="text-xl font-semibold tracking-tight">
              {page.title}
            </h2>
            <GuidePageBody page={page} />
          </section>
        ))}
      </div>

      <StickyActions>
        <Button
          type="button"
          className="h-14 w-full text-lg"
          disabled={restored}
          onClick={onRestoreTips}
        >
          {restored
            ? "Подсказки снова на «Сегодня» и в «Тренировках»"
            : "Вернуть подсказки на экраны"}
        </Button>
      </StickyActions>
    </div>
  );
}
