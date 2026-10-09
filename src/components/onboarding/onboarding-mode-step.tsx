"use client";

import { CookieMark, Doodle, DUMBBELL_VIEWBOX, DumbbellMark } from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function OnboardingModeStep({
  gymEnabled,
  invalid = false,
  onPick,
}: {
  gymEnabled: boolean | null;
  invalid?: boolean;
  onPick: (gymEnabled: boolean) => void;
}) {
  const unselected = gymEnabled == null;

  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label="Что ведём"
      aria-invalid={invalid || undefined}
    >
      <Button
        type="button"
        variant={gymEnabled === false ? "default" : "outline"}
        aria-pressed={gymEnabled === false}
        className={cn(
          "h-auto min-h-16 w-full flex-col items-stretch gap-1.5 px-5 py-4 text-left whitespace-normal",
          unselected && "border-border",
          invalid && unselected && "border-destructive/50",
        )}
        onClick={() => {
          haptic("tick");
          onPick(false);
        }}
      >
        <span className="flex items-center gap-2 text-lg font-medium">
          <Doodle className="size-5 shrink-0" viewBox="-12 -12 24 24">
            <CookieMark />
          </Doodle>
          Только питание
        </span>
        <span
          className={
            gymEnabled === false
              ? "text-sm font-normal leading-snug text-primary-foreground/85"
              : "text-sm font-normal leading-snug text-muted-foreground"
          }
        >
          Дневник еды и цели. Зал можно включить позже в настройках.
        </span>
      </Button>
      <Button
        type="button"
        variant={gymEnabled === true ? "default" : "outline"}
        aria-pressed={gymEnabled === true}
        className={cn(
          "h-auto min-h-16 w-full flex-col items-stretch gap-1.5 px-5 py-4 text-left whitespace-normal",
          unselected && "border-border",
          invalid && unselected && "border-destructive/50",
        )}
        onClick={() => {
          haptic("tick");
          onPick(true);
        }}
      >
        <span className="flex items-center gap-2 text-lg font-medium">
          <Doodle className="size-5 shrink-0" viewBox={DUMBBELL_VIEWBOX}>
            <DumbbellMark />
          </Doodle>
          Питание и тренировки
        </span>
        <span
          className={
            gymEnabled === true
              ? "text-sm font-normal leading-snug text-primary-foreground/85"
              : "text-sm font-normal leading-snug text-muted-foreground"
          }
        >
          Еда, программа в зале, веса и разборы.
        </span>
      </Button>
    </div>
  );
}
