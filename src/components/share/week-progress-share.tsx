"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-cache";
import { SHARE_STORY_LABEL, SHARE_STORY_UNAVAILABLE } from "@/lib/share/joy";
import {
  prepareWeekShare,
  shareUnavailableMessage,
  shareWeekToChat,
  shareWeekToStory,
  type WeekSharePayload,
} from "@/lib/share/share-message";
import {
  WEEK_PROGRESS_CHAT_LABEL,
  WEEK_PROGRESS_HINT,
  WEEK_PROGRESS_TITLE,
} from "@/lib/share/week-card";
import { haptic } from "@/lib/telegram/haptic";
import { isShareToStoryAvailable } from "@/lib/telegram/share-story";
import { cn } from "@/lib/utils";

export function WeekProgressShare({
  tone = "solid",
  motion = true,
}: {
  tone?: "solid" | "card";
  /** Rise animation shifts layout paint; disable at the bottom of a long scroll. */
  motion?: boolean;
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
        setError(SHARE_STORY_UNAVAILABLE);
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
          "flex flex-col gap-3 rounded-xl px-5 py-4",
          motion && "animate-rise",
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
            {SHARE_STORY_LABEL}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
