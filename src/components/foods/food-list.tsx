"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CatalogFood } from "@/lib/food/catalog-map";
import { formatYieldGrams, parseFoodYield } from "@/lib/food/yield";
import { FOOD_STATE_LABELS } from "@/lib/foods";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FoodRowData = Pick<
  Food,
  | "name"
  | "brand"
  | "protein_per_100"
  | "fat_per_100"
  | "carbs_per_100"
  | "kcal_per_100"
> &
  Partial<Pick<Food, "state" | "yield_from_g" | "yield_to_g">>;

/**
 * Foods as one card of rows, like every other list in the app: name and
 * macros on the left, kcal per 100 g on the right, star to favourite.
 */
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
  const rowClass =
    "flex min-w-0 flex-1 items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40";

  return (
    <ul className="card-surface animate-rise divide-y divide-border/70 px-5 py-1">
      {foods.map((food) => (
        <li key={food.id} className="flex items-stretch">
          {onSelectFood ? (
            <button
              type="button"
              className={rowClass}
              onClick={() => onSelectFood(food)}
            >
              <FoodListBody food={food} />
            </button>
          ) : (
            <Link
              href={hrefForFood ? hrefForFood(food) : `/food/${food.id}`}
              className={rowClass}
            >
              <FoodListBody food={food} />
            </Link>
          )}
          {favoriteVisible ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="-mr-3 h-auto w-12 self-stretch rounded-lg"
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
        </li>
      ))}
    </ul>
  );
}

export function CatalogFoodList({
  foods,
  pendingId,
  onSelectFood,
}: {
  foods: CatalogFood[];
  pendingId?: string | null;
  onSelectFood: (food: CatalogFood) => void;
}) {
  return (
    <ul className="card-surface animate-rise divide-y divide-border/70 px-5 py-1">
      {foods.map((food) => (
        <li key={food.id}>
          <button
            type="button"
            className="flex min-w-0 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
            disabled={pendingId === food.id}
            onClick={() => onSelectFood(food)}
          >
            <FoodListBody food={food} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function FoodListBody({ food }: { food: FoodRowData }) {
  const yieldPair = parseFoodYield({
    state: food.state ?? "as_is",
    yield_from_g: food.yield_from_g ?? null,
    yield_to_g: food.yield_to_g ?? null,
  });
  const subtitle = [
    yieldPair
      ? `${formatYieldGrams(yieldPair.from_g)} → ${formatYieldGrams(yieldPair.to_g)}`
      : null,
    food.brand,
  ]
    .filter(Boolean)
    .join(" · ");
  // State sits under the kcal so the macro line never gets pushed off-screen.
  const state =
    food.state != null && food.state !== "as_is"
      ? FOOD_STATE_LABELS[food.state].toLowerCase()
      : null;

  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium">
          {food.name}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {subtitle ? `${subtitle} · ` : null}Б{" "}
          {formatMacro(food.protein_per_100)} · Ж{" "}
          {formatMacro(food.fat_per_100)} · У {formatMacro(food.carbs_per_100)}
        </span>
      </span>
      <span className="shrink-0 text-right text-sm text-muted-foreground">
        <span className="block tabular-nums">
          {formatKcal(food.kcal_per_100)} ккал
        </span>
        {state ? <span className="block text-xs">{state}</span> : null}
      </span>
    </>
  );
}
