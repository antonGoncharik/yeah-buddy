"use client";

import { CookieDoodle } from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import type { GuideTip } from "@/lib/guide";
import { haptic } from "@/lib/telegram/haptic";

export function GuideTipCard({
  tip,
  onDismiss,
}: {
  tip: GuideTip;
  onDismiss: () => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CookieDoodle className="size-4 text-primary/80" />
          Подсказка
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          {tip.title}
        </h2>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        {tip.body}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full text-base"
        onClick={() => {
          haptic("tick");
          onDismiss();
        }}
      >
        Понятно
      </Button>
    </section>
  );
}
