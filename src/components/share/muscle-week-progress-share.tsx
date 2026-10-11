"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-cache";
import { SHARE_STORY_LABEL, SHARE_STORY_UNAVAILABLE } from "@/lib/share/joy";
import {
  MUSCLE_WEEK_CARD_BUTTON,
  MUSCLE_WEEK_CARD_TITLE,
} from "@/lib/share/muscle-week-card";
import {
  prepareMuscleWeekShare,
  shareMuscleWeekToChat,
  shareMuscleWeekToStory,
  shareUnavailableMessage,
  type WeekSharePayload,
} from "@/lib/share/share-message";
import { haptic } from "@/lib/telegram/haptic";
import { isShareToStoryAvailable } from "@/lib/telegram/share-story";
import { loadTelegramWebApp } from "@/lib/telegram/webapp";
import { cn } from "@/lib/utils";

export function MuscleWeekProgressShare({
  tone = "card",
}: {
  tone?: "solid" | "card";
}) {
  const [busy, setBusy] = useState<"chat" | "story" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyOk, setStoryOk] = useState(false);
  const cache = useRef<WeekSharePayload | null>(null);

  useEffect(() => {
    void loadTelegramWebApp().then((webApp) => {
      setStoryOk(isShareToStoryAvailable(webApp));
    });
  }, []);

  async function loadPayload(): Promise<WeekSharePayload | null> {
    if (cache.current) {
      return cache.current;
    }
    const payload = await prepareMuscleWeekShare();
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
      const result = await shareMuscleWeekToChat(payload);
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
      const result = await shareMuscleWeekToStory(payload);
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
          tone === "solid"
            ? "bg-primary text-primary-foreground"
            : "card-surface",
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold">
            {MUSCLE_WEEK_CARD_TITLE}
          </span>
          <span
            className={cn(
              "text-sm",
              tone === "solid" ? "opacity-80" : "text-muted-foreground",
            )}
          >
            Поделись объёмом за 7 дней — без весов и калорий.
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant={tone === "solid" ? "secondary" : "default"}
            className="h-12 flex-1 text-base"
            disabled={working}
            onClick={() => void shareChat()}
          >
            {busy === "chat" ? "Готовлю…" : "В чат"}
          </Button>
          {storyOk ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 text-base"
              disabled={working}
              onClick={() => void shareStory()}
            >
              {busy === "story" ? "Открываю…" : SHARE_STORY_LABEL}
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm leading-snug text-destructive">{error}</p>
        ) : null}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {MUSCLE_WEEK_CARD_BUTTON}
      </p>
    </div>
  );
}
