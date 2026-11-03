"use client";

import { Camera, Mic, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  mealActionFullButtonClass,
  mealActionIconSegmentClass,
  mealActionPrimarySegmentClass,
} from "@/components/day/meal-action-bar";
import { AlignedPair } from "@/components/ui/aligned-pair";
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
  const amount = item.lump
    ? null
    : `${formatGrams(item.grams)} г · ${formatKcal(item.kcal)} ккал`;
  const macros = `Б ${formatMacro(item.protein)} · Ж ${formatMacro(item.fat)} · У ${formatMacro(item.carbs)}`;
  const showMacros = macrosOpen || Boolean(item.lump);

  if (onEditGrams) {
    const nameClassName = cn(
      "min-w-0 truncate rounded-xl px-1 py-2 text-base font-medium",
      href &&
        "transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60",
    );
    return (
      <div className="flex w-full min-w-0 items-center gap-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {href ? (
            <Link href={href} className={nameClassName}>
              {item.name}
            </Link>
          ) : (
            <p className={nameClassName}>{item.name}</p>
          )}
          {macrosOpen ? (
            <p className="px-1 text-sm text-muted-foreground tabular-nums">
              {macros}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 shrink-0 px-2 text-sm"
          aria-expanded={macrosOpen}
          onClick={() => setMacrosOpen((open) => !open)}
        >
          БЖУ
        </Button>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-medium text-muted-foreground tabular-nums transition-colors hover:bg-muted/60"
          onClick={onEditGrams}
        >
          {item.lump
            ? `${formatKcal(item.kcal)} ккал`
            : `${formatGrams(item.grams)} г`}
        </button>
        {item.lump ? null : (
          <span className="w-14 shrink-0 text-right text-base font-semibold tabular-nums">
            {formatKcal(item.kcal)}
          </span>
        )}
        {onDelete ? (
          <div className="self-center">
            <RemoveRowButton onClick={onDelete} />
          </div>
        ) : null}
      </div>
    );
  }

  const detail = [amount, showMacros ? macros : null]
    .filter((line) => line != null)
    .join(" · ");
  const nameClass = cn(
    "min-w-0 text-base font-medium",
    wrapName ? "break-words" : "flex-1 truncate",
  );

  const body = item.lump ? (
    wrapName ? (
      <span className="flex w-full min-w-0 flex-col gap-0.5">
        <span className={nameClass}>{item.name}</span>
        {detail ? (
          <span className="self-end text-sm text-muted-foreground tabular-nums">
            {detail}
          </span>
        ) : null}
      </span>
    ) : (
      <span className="flex w-full min-w-0 items-baseline justify-between gap-3 overflow-hidden">
        <span className={nameClass}>{item.name}</span>
        {detail ? (
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {detail}
          </span>
        ) : null}
      </span>
    )
  ) : wrapName ? (
    <span className="flex w-full min-w-0 flex-col gap-0.5">
      <span className={nameClass}>{item.name}</span>
      <AlignedPair
        className="grid-cols-[4.75rem_3.5rem] self-end"
        leading={
          <span className="text-sm font-medium text-muted-foreground">
            {formatGrams(item.grams)} г
          </span>
        }
        trailing={
          <span className="text-base font-semibold">
            {formatKcal(item.kcal)}
          </span>
        }
      />
      {macrosOpen ? (
        <span className="text-sm text-muted-foreground tabular-nums">
          {macros}
        </span>
      ) : null}
    </span>
  ) : (
    <span className="flex w-full min-w-0 flex-col gap-0.5 overflow-hidden">
      <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
        <span className={nameClass}>{item.name}</span>
        <AlignedPair
          className="grid-cols-[4.75rem_3.5rem]"
          leading={
            <span className="text-sm font-medium text-muted-foreground">
              {formatGrams(item.grams)} г
            </span>
          }
          trailing={
            <span className="text-base font-semibold">
              {formatKcal(item.kcal)}
            </span>
          }
        />
      </span>
      {macrosOpen ? (
        <span className="text-sm text-muted-foreground tabular-nums">
          {macros}
        </span>
      ) : null}
    </span>
  );

  return (
    <div className="flex w-full min-w-0 items-stretch gap-1">
      {href ? (
        <Link
          href={href}
          className={cn(
            "flex min-w-0 flex-1 items-center rounded-xl px-1 py-2 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60",
          )}
        >
          <div className="min-w-0 w-full">{body}</div>
        </Link>
      ) : (
        <div className={cn("flex min-w-0 flex-1 items-center px-1 py-2")}>
          <div className="min-w-0 w-full">{body}</div>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 shrink-0 self-center px-2 text-sm"
        aria-expanded={macrosOpen}
        onClick={() => setMacrosOpen((open) => !open)}
      >
        БЖУ
      </Button>
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
