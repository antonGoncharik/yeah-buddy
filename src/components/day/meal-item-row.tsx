"use client";

import { Camera, Mic, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  mealActionFullButtonClass,
  mealActionIconSegmentClass,
  mealActionPrimarySegmentClass,
} from "@/components/day/meal-action-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { lumpHref } from "@/lib/day/lump";
import { formatGrams, formatKcal, formatMacro } from "@/lib/nutrition";
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
  onEditGrams,
  wrapName = false,
}: {
  item: MealLine;
  href?: string;
  onDelete?: () => void;
  /** Open a portion sheet instead of leaving Today. Catalog rows only. */
  onEditGrams?: () => void;
  /** Show the full product name (multi-line); default is one truncated line. */
  wrapName?: boolean;
}) {
  const [macrosOpen, setMacrosOpen] = useState(false);
  const macros = `Б ${formatMacro(item.protein)} · Ж ${formatMacro(item.fat)} · У ${formatMacro(item.carbs)}`;
  const showMacros = macrosOpen || Boolean(item.lump);
  const gramsLabel = item.lump ? null : `${formatGrams(item.grams)} г`;
  const nameClassName = cn(
    "block min-w-0 rounded-xl px-1 py-2 text-base font-medium",
    wrapName ? "break-words" : "truncate",
    href &&
      "transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60",
  );

  return (
    <div
      className={cn(
        "grid w-full min-w-0 items-center gap-x-1",
        onDelete
          ? "grid-cols-[minmax(0,1fr)_2.75rem_4.75rem_3.5rem_2.75rem]"
          : "grid-cols-[minmax(0,1fr)_2.75rem_4.75rem_3.5rem]",
      )}
    >
      {href ? (
        <Link href={href} className={nameClassName}>
          {item.name}
        </Link>
      ) : (
        <p className={nameClassName}>{item.name}</p>
      )}
      {item.lump ? (
        <span />
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full px-0 text-sm"
          aria-expanded={macrosOpen}
          onClick={() => setMacrosOpen((open) => !open)}
        >
          БЖУ
        </Button>
      )}
      {gramsLabel && onEditGrams ? (
        <button
          type="button"
          className="min-h-11 w-full rounded-lg text-right text-sm font-medium text-muted-foreground tabular-nums transition-colors hover:bg-muted/60"
          onClick={onEditGrams}
        >
          {gramsLabel}
        </button>
      ) : (
        <span className="text-right text-sm font-medium text-muted-foreground tabular-nums">
          {gramsLabel}
        </span>
      )}
      <span className="text-right text-base font-semibold tabular-nums">
        {formatKcal(item.kcal)}
      </span>
      {onDelete ? (
        <div className="justify-self-end">
          <RemoveRowButton onClick={onDelete} />
        </div>
      ) : null}
      {showMacros ? (
        <p className="col-span-4 px-1 pb-2 text-sm text-muted-foreground tabular-nums">
          {macros}
        </p>
      ) : null}
    </div>
  );
}

export function MealAddLink({
  href,
  prominent = false,
  className,
}: {
  href: string;
  prominent?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: prominent ? "default" : "outline" }),
        mealActionFullButtonClass,
        className,
      )}
    >
      <Plus className="size-4" aria-hidden />
      Добавить
    </Link>
  );
}

export function MealPlateLink({
  href,
  compact = false,
  segmentClassName,
}: {
  href: string;
  compact?: boolean;
  segmentClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Фото тарелки"
      className={cn(
        segmentClassName,
        !segmentClassName &&
          buttonVariants({ variant: compact ? "outline" : "ghost" }),
        !segmentClassName && compact
          ? cn(mealActionIconSegmentClass, "rounded-xl")
          : null,
        !segmentClassName && !compact
          ? cn(
              mealActionPrimarySegmentClass,
              "shrink rounded-xl px-2 text-muted-foreground",
            )
          : null,
      )}
    >
      <Camera aria-hidden />
      {compact ? null : "Фото тарелки"}
    </Link>
  );
}

export function MealDictateLink({
  href,
  compact = false,
  segmentClassName,
}: {
  href: string;
  compact?: boolean;
  segmentClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Голосом"
      className={cn(
        segmentClassName,
        !segmentClassName &&
          buttonVariants({ variant: compact ? "outline" : "ghost" }),
        !segmentClassName && compact
          ? cn(mealActionIconSegmentClass, "rounded-xl")
          : null,
        !segmentClassName && !compact
          ? cn(
              mealActionPrimarySegmentClass,
              "shrink rounded-xl px-2 text-muted-foreground",
            )
          : null,
      )}
    >
      <Mic aria-hidden />
      {compact ? null : "Голосом"}
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
        mealActionFullButtonClass,
      )}
    >
      {trimmed ? (
        `Записать «${trimmed}»`
      ) : (
        <>
          <Plus className="size-4" aria-hidden />
          Быстрая запись
        </>
      )}
    </Link>
  );
}
