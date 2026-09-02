"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FOOD_STATE_LABELS } from "@/lib/foods";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FoodList({
  foods,
  onToggleFavorite,
}: {
  foods: Food[];
  onToggleFavorite: (food: Food) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {foods.map((food) => (
        <li key={food.id}>
          <div className="flex items-stretch rounded-xl border bg-card">
            <Link
              href={`/food/${food.id}`}
              className="min-w-0 flex-1 px-4 py-3"
            >
              <p className="truncate text-base font-medium">{food.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {[food.brand, FOOD_STATE_LABELS[food.state]]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Б {formatMacro(food.protein_per_100)} · Ж{" "}
                {formatMacro(food.fat_per_100)} · У{" "}
                {formatMacro(food.carbs_per_100)} ·{" "}
                {formatKcal(food.kcal_per_100)} ккал
              </p>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="h-auto min-w-14 rounded-none rounded-r-xl"
              aria-label={
                food.is_favorite
                  ? "Убрать из избранного"
                  : "Добавить в избранное"
              }
              onClick={() => onToggleFavorite(food)}
            >
              <Star
                className={cn(
                  "size-5",
                  food.is_favorite && "fill-current text-yellow-500",
                )}
              />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
