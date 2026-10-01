"use client";

import { useState } from "react";

import { FoldChevron } from "@/components/ui/fold-chevron";
import type { ReviewText } from "@/lib/ai/types";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function ReviewTextCard({
  review,
  label,
  muted = false,
  defaultOpen = false,
}: {
  review: ReviewText & { from?: string; to?: string };
  label?: string;
  muted?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rangeLabel = reviewRangeLabel(review.from, review.to);

  return (
    <section
      className={cn(
        "card-surface animate-rise px-5 py-4",
        muted && "bg-muted/40",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
        onClick={() => {
          haptic("tick");
          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 flex-1">
          {label || rangeLabel ? (
            <p className="text-sm font-medium text-muted-foreground">
              {label}
              {label && rangeLabel ? " · " : null}
              {rangeLabel}
            </p>
          ) : null}
          <h2
            className={cn(
              "font-semibold tracking-tight",
              muted ? "text-xl" : "text-2xl",
              (label || rangeLabel) && "mt-1",
            )}
          >
            {review.headline}
          </h2>
        </span>
        <FoldChevron open={open} />
      </button>
      {open ? (
        <div className="mt-5 flex flex-col gap-5">
          <ul className="flex flex-col gap-4">
            {review.observations.map((item, index) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed">
                <span className="mt-0.5 w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {review.watch.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 px-4 py-3.5">
              <p className="text-sm font-medium text-muted-foreground">
                Дальше
              </p>
              <ul className="flex flex-col gap-3">
                {review.watch.map((item) => (
                  <li key={item} className="text-base leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function reviewRangeLabel(from?: string, to?: string): string | null {
  if (!from || !to) {
    return null;
  }

  return `${formatIsoDate(from, "d MMM")} – ${formatIsoDate(to, "d MMM")}`;
}
