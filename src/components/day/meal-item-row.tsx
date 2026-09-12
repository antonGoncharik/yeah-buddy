"use client";

import { Camera, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { lumpHref } from "@/lib/day/lump";
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
  lump?: boolean;
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
        {item.lump
          ? `Б ${formatMacro(item.protein)} · Ж ${formatMacro(item.fat)} · У ${formatMacro(item.carbs)}`
          : `${formatMacro(item.grams)} г · ${formatKcal(item.kcal)} ккал`}
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

export function MealAddLink({
  href,
  prominent = false,
}: {
  href: string;
  prominent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: prominent ? "default" : "outline" }),
        "h-12 w-full gap-2 rounded-xl text-base",
      )}
    >
      <Plus className="size-4" aria-hidden />
      Добавить
    </Link>
  );
}

export function MealPlateLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-11 w-full gap-2 rounded-xl text-base text-muted-foreground",
      )}
    >
      <Camera className="size-4" aria-hidden />
      Фото тарелки
    </Link>
  );
}

export function MealLumpLink({
  href,
  query,
}: {
  href: string;
  query?: string;
}) {
  const trimmed = query?.trim() ?? "";
  return (
    <Link
      href={lumpHref(href, trimmed)}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-12 w-full rounded-xl text-base",
      )}
    >
      {trimmed ? `Записать «${trimmed}»` : "Разовая порция"}
    </Link>
  );
}
