"use client";

import { Plus, ScanBarcode } from "lucide-react";
import Link from "next/link";

import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { buttonVariants } from "@/components/ui/button";
import { EMPTY_START_REPEAT, EMPTY_START_SCAN } from "@/lib/messages";
import type { EmptyStartCopy } from "@/lib/retention";
import { cn } from "@/lib/utils";

export function TodayEmptyStart({
  yesterdayHasFood,
  copy,
  addHref,
  scanHref,
  busy,
  onCopyYesterday,
}: {
  yesterdayHasFood: boolean;
  copy: EmptyStartCopy | null;
  addHref: string | null;
  scanHref: string | null;
  busy: boolean;
  onCopyYesterday: () => void;
}) {
  if (!yesterdayHasFood && !addHref) {
    return null;
  }

  const scanFirst = copy === "scan" && scanHref;
  const repeat = yesterdayHasFood;

  return (
    <div className="flex flex-col gap-3">
      {copy === "repeat" ? (
        <p className="text-base text-muted-foreground">{EMPTY_START_REPEAT}</p>
      ) : null}
      {copy === "scan" ? (
        <p className="text-base text-muted-foreground">{EMPTY_START_SCAN}</p>
      ) : null}
      {repeat ? (
        <CopyYesterdayButton
          busy={busy}
          label={copy === "repeat" ? "Повторить" : "Как вчера"}
          variant={copy === "repeat" ? "default" : "outline"}
          onCopy={onCopyYesterday}
        />
      ) : null}
      {scanFirst ? (
        <Link
          href={scanFirst}
          className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
        >
          <ScanBarcode className="size-5" aria-hidden />
          Сканировать
        </Link>
      ) : null}
      {addHref ? (
        <Link
          href={addHref}
          className={cn(
            buttonVariants({
              variant: repeat || scanFirst ? "outline" : "default",
            }),
            "h-14 w-full gap-2 text-lg",
          )}
        >
          <Plus className="size-5" aria-hidden />
          {repeat ? "Добавить" : "Добавь первое"}
        </Link>
      ) : null}
      {repeat || scanFirst || !scanHref ? null : (
        <Link
          href={scanHref}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-14 w-full gap-2 text-lg",
          )}
        >
          <ScanBarcode className="size-5" aria-hidden />
          Сканировать
        </Link>
      )}
    </div>
  );
}
