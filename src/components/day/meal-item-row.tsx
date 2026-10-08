"use client";

import { Camera, Mic, Plus } from "lucide-react";
import Link from "next/link";

import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { AlignedPair } from "@/components/ui/aligned-pair";
import { buttonVariants } from "@/components/ui/button";
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
  wrapName = false,
}: {
  item: MealLine;
  href?: string;
  onDelete?: () => void;
  /** Show the full product name (multi-line); default is one truncated line. */
  wrapName?: boolean;
}) {
  const { density } = useDiaryDensity();
  const expanded = density === "expanded";
  const amount = item.lump
    ? expanded
      ? `${formatKcal(item.kcal)} ккал`
      : null
    : `${formatGrams(item.grams)} г · ${formatKcal(item.kcal)} ккал`;
  const macros = `Б ${formatMacro(item.protein)} · Ж ${formatMacro(item.fat)} · У ${formatMacro(item.carbs)}`;
  const showMacros = expanded || Boolean(item.lump);

  const detail = [amount, showMacros ? macros : null]
    .filter((line) => line != null)
    .join(" · ");
  const nameClass = cn(
    "min-w-0 font-medium",
    expanded ? "text-lg" : "text-base",
    wrapName ? "break-words" : "flex-1 truncate",
  );

  const body = expanded ? (
    <>
      <p className={nameClass}>{item.name}</p>
      {amount ? (
        <p className="text-sm text-muted-foreground tabular-nums">{amount}</p>
      ) : null}
      {showMacros ? (
        <p className="text-sm text-muted-foreground tabular-nums">{macros}</p>
      ) : null}
    </>
  ) : item.lump ? (
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
    </span>
  ) : (
    <span className="flex w-full min-w-0 items-baseline justify-between gap-3 overflow-hidden">
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
  );

  return (
    <div className="flex w-full min-w-0 items-stretch gap-1">
      {href ? (
        <Link
          href={href}
          className={cn(
            "min-w-0 flex-1 rounded-xl px-1 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/60",
            expanded ? "py-3" : "py-2",
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={cn("min-w-0 flex-1 px-1", expanded ? "py-3" : "py-2")}>
          {body}
        </div>
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
        "h-12 w-full gap-2 rounded-xl text-base",
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
}: {
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Фото тарелки"
      className={cn(
        buttonVariants({ variant: compact ? "outline" : "ghost" }),
        compact
          ? "size-12 shrink-0 rounded-xl px-0"
          : "h-11 min-w-0 flex-1 shrink gap-2 rounded-xl px-2 text-base text-muted-foreground",
      )}
    >
      <Camera className="size-4" aria-hidden />
      {compact ? null : "Фото тарелки"}
    </Link>
  );
}

export function MealDictateLink({
  href,
  compact = false,
}: {
  href: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Голосом"
      className={cn(
        buttonVariants({ variant: compact ? "outline" : "ghost" }),
        compact
          ? "size-12 shrink-0 rounded-xl px-0"
          : "h-11 min-w-0 flex-1 shrink gap-2 rounded-xl px-2 text-base text-muted-foreground",
      )}
    >
      <Mic className="size-4" aria-hidden />
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
        "h-12 w-full gap-2 rounded-xl text-base",
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
