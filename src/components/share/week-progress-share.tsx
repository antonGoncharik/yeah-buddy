"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-cache";
import {
  prepareWeekShare,
  shareUnavailableMessage,
  shareWeekToChat,
  shareWeekToStory,
  type WeekSharePayload,
} from "@/lib/share/share-message";
import {
  WEEK_PROGRESS_CHAT_LABEL,
  WEEK_PROGRESS_DETAIL_LINES,
  WEEK_PROGRESS_DETAILS_TITLE,
  WEEK_PROGRESS_HINT,
  WEEK_PROGRESS_STORY_LABEL,
  WEEK_PROGRESS_TITLE,
} from "@/lib/share/week-card";
import { isShareToStoryAvailable } from "@/lib/telegram/share-story";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function WeekProgressShare({
  tone = "solid",
}: {
  tone?: "solid" | "card";
}) {
  const [busy, setBusy] = useState<"chat" | "story" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyOk, setStoryOk] = useState(false);
  const cache = useRef<WeekSharePayload | null>(null);

  useEffect(() => {
    void import("@twa-dev/sdk").then((sdk) => {
      setStoryOk(isShareToStoryAvailable(sdk.default));
    });
  }, []);

  async function loadPayload(): Promise<WeekSharePayload | null> {
    if (cache.current) {
      return cache.current;
    }
    const payload = await prepareWeekShare();
    if (payload) {
      cache.current = payload;
    }
    return payload;
  }

  async function shareChat() {
    setBusy("chat");
    setError(null);
    haptic("commit");
    try {
      const payload = await loadPayload();
      if (!payload) {
        setError(shareUnavailableMessage());
        return;
      }
      const result = await shareWeekToChat(payload);
      if (result === "failed") {
        setError(shareUnavailableMessage());
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : shareUnavailableMessage(),
      );
    } finally {
      setBusy(null);
    }
  }

  async function shareStory() {
    setBusy("story");
    setError(null);
    haptic("commit");
    try {
      const payload = await loadPayload();
      if (!payload) {
        setError(shareUnavailableMessage());
        return;
      }
      const result = await shareWeekToStory(payload);
      if (result === "unavailable") {
        setError(
          "Сторис недоступны в этом Telegram — попробуй «В чат» или обнови приложение.",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : shareUnavailableMessage(),
      );
    } finally {
      setBusy(null);
    }
  }

  const working = busy != null;

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "animate-rise flex flex-col gap-3 rounded-xl px-5 py-4",
          tone === "solid"
            ? "bg-primary text-primary-foreground"
            : "card-surface",
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold">{WEEK_PROGRESS_TITLE}</span>
          <span
            className={cn(
              "text-sm",
              tone === "solid" ? "opacity-80" : "text-muted-foreground",
            )}
          >
            {working ? "Собираю картинку…" : WEEK_PROGRESS_HINT}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={tone === "solid" ? "secondary" : "default"}
            className="h-12 text-base"
            disabled={working}
            aria-busy={busy === "chat"}
            onClick={() => void shareChat()}
          >
            {WEEK_PROGRESS_CHAT_LABEL}
          </Button>
          <Button
            type="button"
            variant={tone === "solid" ? "secondary" : "outline"}
            className="h-12 text-base"
            disabled={working || !storyOk}
            aria-busy={busy === "story"}
            onClick={() => void shareStory()}
          >
            {WEEK_PROGRESS_STORY_LABEL}
          </Button>
        </div>
      </div>

      <details className="card-surface animate-rise rounded-xl px-5 py-3">
        <summary className="cursor-pointer text-sm font-medium">
          {WEEK_PROGRESS_DETAILS_TITLE}
        </summary>
        <ul
          className="mt-3 flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground"
        >
          {WEEK_PROGRESS_DETAIL_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
