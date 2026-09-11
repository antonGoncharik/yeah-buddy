"use client";

import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatYieldGrams, parseFoodYield } from "@/lib/food/yield";
import { FOOD_STATE_LABELS } from "@/lib/foods";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FoodList({
  foods,
  hrefForFood,
  onSelectFood,
  showFavorite = true,
  onToggleFavorite,
}: {
  foods: Food[];
  hrefForFood?: (food: Food) => string;
  onSelectFood?: (food: Food) => void;
  showFavorite?: boolean;
  onToggleFavorite?: (food: Food) => void;
}) {
  const favoriteVisible = showFavorite && onToggleFavorite;

  return (
    <ul className="flex flex-col gap-2">
      {foods.map((food, index) => (
        <li
          key={food.id}
          className="animate-rise"
          style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
        >
          <div className="card-surface flex items-stretch overflow-hidden">
            {onSelectFood ? (
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                onClick={() => onSelectFood(food)}
              >
                <FoodListBody food={food} />
              </button>
            ) : (
              <Link
                href={hrefForFood ? hrefForFood(food) : `/food/${food.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <FoodListBody food={food} />
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            )}
            {favoriteVisible ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="h-auto min-w-14 rounded-none rounded-r-2xl"
                aria-label={
                  food.is_favorite
                    ? "Убрать из избранного"
                    : "Добавить в избранное"
                }
                onClick={() => onToggleFavorite(food)}
              >
                <Star
                  className={cn(
                    "size-5 transition-[transform,fill,color] duration-300 ease-[var(--ease-out-soft)]",
                    food.is_favorite && "scale-110 fill-current text-primary",
                  )}
                />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FoodListBody({ food }: { food: Food }) {
  const yieldPair = parseFoodYield(food);
  const subtitle = [
    food.state !== "as_is" ? FOOD_STATE_LABELS[food.state] : null,
    yieldPair
      ? `${formatYieldGrams(yieldPair.from_g)} → ${formatYieldGrams(yieldPair.to_g)}`
      : null,
    food.brand,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className="min-w-0 flex-1">
      <p className="truncate text-lg font-medium">{food.name}</p>
      {subtitle ? (
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">
        Б {formatMacro(food.protein_per_100)} · Ж{" "}
        {formatMacro(food.fat_per_100)} · У {formatMacro(food.carbs_per_100)} ·{" "}
        {formatKcal(food.kcal_per_100)} ккал
      </p>
    </span>
  );
}
