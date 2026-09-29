"use client";

import { calendarToday } from "@/lib/day/dates";
import { goalModeLine } from "@/lib/flavor";
import { ONBOARDING_GOAL_OPTIONS, type OnboardingGoal } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

/** Selected goal tiles use filled primary — not outline / ring. */
export const GOAL_OPTION_SELECTED_CLASS =
  "bg-primary text-primary-foreground shadow-sm";
export const GOAL_OPTION_UNSELECTED_CLASS = "card-surface hover:bg-muted/30";

export function GoalOptionButtons({
  value,
  onPick,
  size = "default",
}: {
  value: OnboardingGoal | null;
  onPick: (value: OnboardingGoal) => void;
  size?: "default" | "compact";
}) {
  const compact = size === "compact";
  const today = calendarToday();

  return (
    <div className="flex flex-col gap-2">
      {ONBOARDING_GOAL_OPTIONS.map((option) => {
        const selected = value === option.id;
        const voiced = option.id === "lose" || option.id === "gain";
        const line = selected && voiced ? goalModeLine(option.id, today) : null;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            className={cn(
              "w-full rounded-2xl text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none",
              compact ? "px-4 py-3" : "px-5 py-4",
              selected
                ? GOAL_OPTION_SELECTED_CLASS
                : GOAL_OPTION_UNSELECTED_CLASS,
            )}
            onClick={() => {
              if (!selected) {
                haptic("tick");
              } else {
                haptic("tap");
              }
              onPick(option.id);
            }}
          >
            <p
              className={cn(
                "font-medium",
                compact ? "text-base" : "text-lg",
              )}
            >
              {option.label}
            </p>
            <p
              className={cn(
                "text-sm",
                compact ? "mt-0.5" : "mt-1",
                selected
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {option.hint}
            </p>
            {line ? (
              <p
                className={cn(
                  "text-sm text-primary-foreground/90",
                  compact ? "mt-1.5" : "mt-2",
                )}
              >
                {line}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
