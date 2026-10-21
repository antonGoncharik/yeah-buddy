"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { GymLoop } from "@/lib/day/loop";
import { cn } from "@/lib/utils";

export function TodayGymStatus({ label, href }: GymLoop) {
  const tappable = href != null;
  const body = (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted-foreground">Зал</p>
      <p
        className={cn(
          "flex min-w-0 items-center gap-0.5 text-base font-semibold tracking-tight",
          !tappable && "text-muted-foreground",
        )}
      >
        <span className="truncate">{label}</span>
        {tappable ? (
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }

  return body;
}
