"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { buttonVariants } from "@/components/ui/button";
import { EMPTY_START_ADD, EMPTY_START_REPEAT } from "@/lib/messages";
import type { EmptyStartCopy } from "@/lib/retention";
import { cn } from "@/lib/utils";

export function TodayEmptyStart({
  yesterdayHasFood,
  copy,
  addHref,
  busy,
  onCopyYesterday,
}: {
  yesterdayHasFood: boolean;
  copy: EmptyStartCopy | null;
  addHref: string | null;
  busy: boolean;
  onCopyYesterday: () => void;
}) {
  if (!yesterdayHasFood && !addHref) {
    return null;
  }

  const repeat = yesterdayHasFood;

  return (
    <div className="flex flex-col gap-3">
      {copy === "repeat" ? (
        <p className="text-base text-muted-foreground">{EMPTY_START_REPEAT}</p>
      ) : null}
      {copy === "add" ? (
        <p className="text-base text-muted-foreground">{EMPTY_START_ADD}</p>
      ) : null}
      {repeat ? (
        <CopyYesterdayButton
          busy={busy}
          label={copy === "repeat" ? "Повторить" : "Как вчера"}
          variant={copy === "repeat" ? "default" : "outline"}
          onCopy={onCopyYesterday}
        />
      ) : null}
      {addHref ? (
        <Link
          href={addHref}
          className={cn(
            buttonVariants({
              variant: repeat ? "outline" : "default",
            }),
            "h-14 w-full gap-2 text-lg",
          )}
        >
          <Plus className="size-5" aria-hidden />
          {repeat ? "Добавить" : "Добавь первое"}
        </Link>
      ) : null}
    </div>
  );
}
