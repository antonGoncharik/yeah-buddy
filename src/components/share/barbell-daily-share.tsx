"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-cache";
import {
  BARBELL_SHARE_STORY,
  BARBELL_SHARE_TO_CHAT,
  type BarbellShareFacts,
} from "@/lib/share/barbell-daily";
import {
  type PhotoSharePayload,
  prepareBarbellShare,
  shareBarbellToChat,
  shareBarbellToStory,
  shareUnavailableMessage,
} from "@/lib/share/share-message";
import { haptic } from "@/lib/telegram/haptic";
import { isShareToStoryAvailable } from "@/lib/telegram/share-story";

export function BarbellDailyShare({ facts }: { facts: BarbellShareFacts }) {
  const [inTelegram, setInTelegram] = useState(false);
  const [storyOk, setStoryOk] = useState(false);
  const [busy, setBusy] = useState<"chat" | "story" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<PhotoSharePayload | null>(null);
  const cacheKey = useRef("");

  useEffect(() => {
    void import("@twa-dev/sdk")
      .then((sdk) => {
        setInTelegram(Boolean(sdk.default.initData));
        setStoryOk(isShareToStoryAvailable(sdk.default));
      })
      .catch(() => {
        setInTelegram(false);
        setStoryOk(false);
      });
  }, []);

  if (!inTelegram) {
    return null;
  }

  async function loadPayload(): Promise<PhotoSharePayload | null> {
    const key = `${facts.dayKey ?? ""}:${facts.targetKg}:${facts.moves}`;
    if (cache.current && cacheKey.current === key) {
      return cache.current;
    }
    const payload = await prepareBarbellShare(facts);
    if (payload) {
      cache.current = payload;
      cacheKey.current = key;
    }
    return payload;
  }

  async function shareChat() {
    setBusy("chat");
    setError(null);
    haptic("commit");
    try {
      const payload = await loadPayload();
      const result = await shareBarbellToChat(facts, payload);
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
      const result = await shareBarbellToStory(payload);
      if (result === "unavailable") {
        setError("Сторис недоступны в этом Telegram — попробуй «В чат».");
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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={working}
          aria-busy={busy === "chat"}
          onClick={() => void shareChat()}
        >
          {BARBELL_SHARE_TO_CHAT}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={working || !storyOk}
          aria-busy={busy === "story"}
          onClick={() => void shareStory()}
        >
          {BARBELL_SHARE_STORY}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
