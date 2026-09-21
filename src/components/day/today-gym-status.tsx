"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { GymLoop } from "@/lib/day/loop";
import { cn } from "@/lib/utils";

export function TodayGymStatus({
  label,
  href,
  templateId,
  busy = false,
  onStart,
}: GymLoop & {
  busy?: boolean;
  onStart?: (templateId: string) => void;
}) {
  const canStart = Boolean(templateId && onStart);
  const tappable = canStart || href != null;
  const body = (
    <>
      <p className="text-sm font-medium text-muted-foreground">Зал</p>
      <p
        className={cn(
          "mt-1 flex items-center justify-end gap-0.5 text-xl font-semibold tracking-tight",
          !tappable && "text-muted-foreground",
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        {tappable ? (
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </p>
    </>
  );

  if (templateId && onStart) {
    return (
      <button
        type="button"
        disabled={busy}
        className="max-w-[48%] text-right transition-opacity disabled:opacity-60"
        onClick={() => onStart(templateId)}
      >
        {body}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="max-w-[48%] text-right">
        {body}
      </Link>
    );
  }

  return <div className="max-w-[48%] text-right">{body}</div>;
}
