import type { NextResponse } from "next/server";

import { jsonError, whenError, whenMessage } from "@/lib/api/respond";
import { MealConflictError, PastDayLockedError } from "@/lib/days";

type RouteFailure = (error: unknown) => NextResponse | null;

/** Shared 409/404 mapping for copying a meal. Extra handlers sit between the lock and the generic misses. */
export function mealCopyFailures(extra: RouteFailure[] = []): RouteFailure[] {
  return [
    whenError(PastDayLockedError, 409),
    ...extra,
    whenMessage("Meal not found", 404, "Приём пищи не найден."),
    (error) =>
      error instanceof MealConflictError
        ? jsonError(error.message, 409, { code: error.code })
        : null,
  ];
}
