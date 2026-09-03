"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { MealItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealItemRow({
  item,
  onDelete,
}: {
  item: MealItem;
  onDelete: (item: MealItem) => void;
}) {
  return (
    <div className="flex items-stretch gap-1">
      <Link
        href={`/today/items/${item.id}`}
        className="min-w-0 flex-1 rounded-lg px-1 py-2"
      >
        <p className="truncate text-base font-medium">{item.name_snapshot}</p>
        <p className="text-sm text-muted-foreground">
          {formatMacro(item.grams)} г · Б {formatMacro(item.protein)} · Ж{" "}
          {formatMacro(item.fat)} · У {formatMacro(item.carbs)} ·{" "}
          {formatKcal(item.kcal)} ккал
        </p>
      </Link>
      <Button
        type="button"
        variant="ghost"
        className="h-auto min-w-12 text-sm text-destructive"
        onClick={() => onDelete(item)}
      >
        Удалить
      </Button>
    </div>
  );
}

export function MealAddLink({ mealId }: { mealId: string }) {
  return (
    <Link
      href={`/today/meals/${mealId}/add`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-11 w-full text-base",
      )}
    >
      Добавить
    </Link>
  );
}
