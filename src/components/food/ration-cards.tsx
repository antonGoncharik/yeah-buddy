"use client";

import { previewRation, RATIONS, type RationId } from "@/lib/food/ration";
import { formatKcal, formatMacro, type Macros } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function RationCards({
  selected,
  goals,
  disabled,
  compact = false,
  onPick,
}: {
  selected: RationId | null;
  goals: { rest: Macros; training: Macros } | null;
  disabled?: boolean;
  compact?: boolean;
  onPick: (id: RationId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {RATIONS.map((preset) => {
        const pressed = selected === preset.id;
        const preview = goals ? previewRation(preset.id, goals) : null;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={pressed}
            disabled={disabled}
            className={cn(
              "w-full rounded-2xl text-left transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.97] motion-reduce:transition-none disabled:opacity-50",
              compact ? "px-4 py-3" : "px-5 py-4",
              pressed
                ? "bg-primary text-primary-foreground shadow-sm"
                : "card-surface hover:bg-muted/30",
            )}
            onClick={() => {
              if (!pressed) {
                haptic("tick");
              } else {
                haptic("tap");
              }
              onPick(preset.id);
            }}
          >
            <p className={cn("font-medium", compact ? "text-base" : "text-lg")}>
              {preset.name}
            </p>
            {compact ? (
              preview ? (
                <p
                  className={cn(
                    "mt-1 text-xs tabular-nums",
                    pressed
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  Отдых {formatKcal(preview.rest.totals.kcal)} · зал{" "}
                  {formatKcal(preview.training.totals.kcal)}
                </p>
              ) : (
                <p
                  className={cn(
                    "mt-1 line-clamp-2 text-xs",
                    pressed
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {preset.hint}
                </p>
              )
            ) : (
              <>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    pressed
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {preset.hint}
                </p>
                {preview ? (
                  <div
                    className={cn(
                      "mt-2 flex flex-col gap-0.5 text-sm tabular-nums",
                      pressed
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    <MacroLine label="Отдых" totals={preview.rest.totals} />
                    <MacroLine
                      label="Тренировка"
                      totals={preview.training.totals}
                    />
                  </div>
                ) : null}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MacroLine({ label, totals }: { label: string; totals: Macros }) {
  return (
    <p>
      {label} · Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} ·
      У {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
    </p>
  );
}
