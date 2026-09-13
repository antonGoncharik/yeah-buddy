"use client";

import { AI_PLATE_EMPTY, AI_REVIEW_NO_KEY } from "@/lib/messages";

export function PlateStatusCopy({
  idle,
  unavailable,
  empty,
}: {
  idle: boolean;
  unavailable: boolean;
  empty: boolean;
}) {
  if (unavailable) {
    return (
      <p className="text-base text-muted-foreground">{AI_REVIEW_NO_KEY}</p>
    );
  }
  if (idle) {
    return (
      <p className="text-base text-muted-foreground">
        Сфотографируй тарелку. Своё из базы — граммы. Остальное — быстрая запись
        порции, в продукты не попадёт.
      </p>
    );
  }
  if (empty) {
    return <p className="text-base text-muted-foreground">{AI_PLATE_EMPTY}</p>;
  }
  return null;
}
