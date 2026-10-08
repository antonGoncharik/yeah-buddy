"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ApiError, mutateJson } from "@/lib/api-cache";
import { withDateQuery } from "@/lib/day/dates";
import { LOAD_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import {
  dismissPendingMealDraftToken,
  peekPendingMealDraftToken,
} from "@/lib/share/pending";

export function MealDraftCatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = peekPendingMealDraftToken();
    if (!token) {
      return;
    }

    if (pathname.includes("/plate") && pathname.includes("chatDraft=")) {
      dismissPendingMealDraftToken(token);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = await mutateJson(`/api/meal-chat-drafts/${token}`);
        if (cancelled || !isRecord(data)) {
          return;
        }
        const mealId = typeof data.mealId === "string" ? data.mealId : null;
        const date = typeof data.date === "string" ? data.date : null;
        if (!mealId || !date) {
          dismissPendingMealDraftToken(token);
          return;
        }

        const base = withDateQuery(`/today/meals/${mealId}/plate`, date, date);
        const join = base.includes("?") ? "&" : "?";
        const target = `${base}${join}chatDraft=${encodeURIComponent(token)}`;

        if (pathname.includes(`/today/meals/${mealId}/plate`)) {
          dismissPendingMealDraftToken(token);
          return;
        }

        router.replace(target);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          dismissPendingMealDraftToken(token);
          return;
        }
        console.error(error instanceof Error ? error.message : LOAD_FAILED);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return children;
}
