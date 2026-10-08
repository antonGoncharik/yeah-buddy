"use client";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { quickAddPortionLabel } from "@/lib/food/quick-add";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FrequentFoodChips({
  foods,
  busy,
  addingId,
  onPick,
  className,
}: {
  foods: Food[];
  busy?: boolean;
  addingId?: string | null;
  onPick: (food: Food) => void;
  className?: string;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";

  if (foods.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {foods.map((food) => {
        const portion = quickAddPortionLabel(food);
        const label = portion ? `${food.name} · ${portion}` : food.name;
        const pending = addingId === food.id;

        return (
          <button
            key={food.id}
            type="button"
            disabled={busy || pending || (addingId != null && addingId !== food.id)}
            onClick={() => onPick(food)}
            className={cn(
              "shrink-0 rounded-full border border-border bg-card px-3 font-medium text-foreground shadow-sm transition-colors",
              "hover:bg-muted/80 active:scale-[0.98] disabled:opacity-50",
              compact ? "min-h-10 py-2 text-sm" : "min-h-12 py-2 text-base",
              pending && "opacity-70",
            )}
          >
            {pending ? "…" : label}
          </button>
        );
      })}
    </div>
  );
}
