"use client";

import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { WiggleTap } from "@/components/layout/wiggle-tap";
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
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {tip.id === "workouts" ? (
            <WiggleTap>
              <DumbbellDoodle className="h-3.5 w-7 text-primary/80" />
            </WiggleTap>
          ) : (
            <WiggleTap>
              <CookieDoodle className="size-4 text-primary/80" />
            </WiggleTap>
          )}
          Подсказка
        </div>
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
