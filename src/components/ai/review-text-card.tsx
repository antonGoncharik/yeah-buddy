"use client";

import type { ReviewText } from "@/lib/ai/types";

export function ReviewTextCard({ review }: { review: ReviewText }) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-4 px-5 py-5">
      <h2 className="text-2xl font-semibold tracking-tight">
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
