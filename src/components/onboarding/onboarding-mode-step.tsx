"use client";

import { CookieMark, Doodle, DUMBBELL_VIEWBOX, DumbbellMark } from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/telegram/haptic";

export function OnboardingModeStep({
  gymEnabled,
  onPick,
}: {
  gymEnabled: boolean | null;
  onPick: (gymEnabled: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant={gymEnabled === false ? "default" : "outline"}
        className="h-auto min-h-16 flex-col items-start gap-1 px-5 py-4 text-left"
        onClick={() => {
          haptic("tick");
          onPick(false);
        }}
      >
        <span className="flex items-center gap-2 text-lg font-medium">
          <Doodle className="size-5" viewBox="-12 -12 24 24">
            <CookieMark />
          </Doodle>
          Только питание
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          Дневник еды и цели. Зал можно включить позже в настройках.
        </span>
      </Button>
      <Button
        type="button"
        variant={gymEnabled === true ? "default" : "outline"}
        className="h-auto min-h-16 flex-col items-start gap-1 px-5 py-4 text-left"
        onClick={() => {
          haptic("tick");
          onPick(true);
        }}
      >
        <span className="flex items-center gap-2 text-lg font-medium">
          <Doodle className="size-5" viewBox={DUMBBELL_VIEWBOX}>
            <DumbbellMark />
          </Doodle>
          Питание и тренировки
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          Еда, программа в зале, веса и разборы.
        </span>
      </Button>
    </div>
  );
}
