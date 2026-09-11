"use client";

import type { ReviewText } from "@/lib/ai/types";
import { formatIsoDate } from "@/lib/day/format";
import { cn } from "@/lib/utils";

export function ReviewTextCard({
  review,
  label,
  muted = false,
}: {
  review: ReviewText & { from?: string; to?: string };
  label?: string;
  muted?: boolean;
}) {
  const rangeLabel = reviewRangeLabel(review.from, review.to);

  return (
    <section
      className={cn(
        "card-surface animate-rise flex flex-col gap-4 px-5 py-5",
        muted && "bg-muted/40",
      )}
    >
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
        )}
      >
        {review.headline}
      </h2>
      <ul className="flex flex-col gap-3">
        {review.observations.map((item) => (
          <li key={item} className="text-base leading-snug">
            {item}
          </li>
        ))}
      </ul>
      {review.watch.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-4">
          <p className="text-sm font-medium text-muted-foreground">Дальше</p>
          <ul className="flex flex-col gap-2">
            {review.watch.map((item) => (
              <li key={item} className="text-base leading-snug">
                {item}
              </li>
            ))}
          </ul>
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
