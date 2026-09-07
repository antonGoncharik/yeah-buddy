"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
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
  href?: string;
  onDelete?: () => void;
}) {
  const body = (
    <>
      <p className="truncate text-lg font-medium">{item.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatMacro(item.grams)} г · Б {formatMacro(item.protein)} · Ж{" "}
        {formatMacro(item.fat)} · У {formatMacro(item.carbs)} ·{" "}
        {formatKcal(item.kcal)} ккал
      </p>
    </>
  );

  return (
    <div className="flex items-stretch gap-1">
      {href ? (
        <Link
          href={href}
          className="min-w-0 flex-1 rounded-xl px-1 py-3 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60"
        >
          {body}
        </Link>
      ) : (
        <div className="min-w-0 flex-1 px-1 py-3">{body}</div>
      )}
      {onDelete ? (
        <div className="self-center">
          <RemoveRowButton onClick={onDelete} />
        </div>
      ) : null}
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
