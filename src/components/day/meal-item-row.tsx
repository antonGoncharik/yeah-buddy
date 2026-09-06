"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export interface MealLine {
  id: string;
  name: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

export function MealItemRow({
  item,
  href,
  onDelete,
}: {
  item: MealLine;
  href: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-stretch gap-1">
      <Link
        href={href}
        className="min-w-0 flex-1 rounded-xl px-1 py-3 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60"
      >
        <p className="truncate text-lg font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatMacro(item.grams)} г · Б {formatMacro(item.protein)} · Ж{" "}
          {formatMacro(item.fat)} · У {formatMacro(item.carbs)} ·{" "}
          {formatKcal(item.kcal)} ккал
        </p>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="size-11 self-center text-destructive"
        aria-label="Удалить"
        onClick={onDelete}
      >
        <Trash2 className="size-5" />
      </Button>
    </div>
  );
}

export function MealAddLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-12 w-full gap-2 rounded-xl text-base",
      )}
    >
      <Plus className="size-4" aria-hidden />
      Добавить продукт
    </Link>
  );
}
