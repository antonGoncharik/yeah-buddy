"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api-cache";
import {
  shareUnavailableMessage,
  shareWeekToChat,
} from "@/lib/share/share-message";
import { WEEK_PROGRESS_HINT, WEEK_PROGRESS_TITLE } from "@/lib/share/week-card";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function WeekProgressShare({
  tone = "solid",
}: {
  tone?: "solid" | "card";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setBusy(true);
    setError(null);
    haptic("commit");
    try {
      const result = await shareWeekToChat();
      if (result === "failed") {
        setError(shareUnavailableMessage());
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : shareUnavailableMessage(),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        className={cn(
          "animate-rise flex w-full flex-col items-start gap-0.5 rounded-xl px-5 py-4 text-left transition-[transform,background-color] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:opacity-60",
          tone === "solid"
            ? "bg-primary text-primary-foreground"
            : "card-surface",
        )}
        onClick={() => void share()}
      >
        <span className="text-lg font-semibold">{WEEK_PROGRESS_TITLE}</span>
        <span
          className={cn(
            "text-sm",
            tone === "solid" ? "opacity-80" : "text-muted-foreground",
          )}
        >
          {busy ? "Собираю…" : WEEK_PROGRESS_HINT}
        </span>
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
