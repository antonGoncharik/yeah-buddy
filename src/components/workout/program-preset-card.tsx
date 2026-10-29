"use client";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import type { ProgramPreset } from "@/lib/workout/program-presets";
import {
  presetExerciseLine,
  programDayExerciseNames,
  programPresetHint,
} from "@/lib/workout/program-presets";

export function ProgramPresetCard({
  preset,
  pressed,
  disabled,
  recommended,
  onPick,
}: {
  preset: ProgramPreset;
  pressed: boolean;
  disabled?: boolean;
  recommended?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl px-5 py-4 text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50",
        pressed
          ? "bg-primary text-primary-foreground shadow-sm"
          : "card-surface hover:bg-muted/30",
      )}
      onClick={() => {
        if (!pressed) {
          haptic("tick");
        }
        onPick();
      }}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-lg font-medium">{preset.name}</p>
        {pressed ? (
          <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            выбрано
          </span>
        ) : null}
        {recommended && !pressed ? (
          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
            советуем для начала
          </span>
        ) : null}
        {preset.cycle ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              pressed
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            вес меняется по неделям
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 text-sm",
          pressed ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {programPresetHint(preset)}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {preset.templates.map((day) => (
          <p key={day.name} className="text-sm leading-snug">
            <span className="font-medium">{day.name}</span>
            <span
              className={
                pressed ? "text-primary-foreground/80" : "text-muted-foreground"
              }
            >
              {" "}
              · {presetExerciseLine(programDayExerciseNames(day))}
            </span>
          </p>
        ))}
        {preset.cycle ? (
          <p
            className={cn(
              "text-sm leading-snug",
              pressed ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            Недели: {preset.cycle.map((phase) => phase.name).join(" → ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
