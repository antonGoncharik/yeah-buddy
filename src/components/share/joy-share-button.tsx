"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-cache";
import {
  type JoyLift,
  type JoyMoment,
  SHARE_HIDE_KG,
  SHARE_STORY_LABEL,
  SHARE_STORY_UNAVAILABLE,
  SHARE_TO_CHAT,
  SHARE_WRITE_KG,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import {
  type JoySharePayload,
  prepareJoyShare,
  shareJoyToChat,
  shareJoyToStory,
  shareUnavailableMessage,
} from "@/lib/share/share-message";
import { haptic } from "@/lib/telegram/haptic";
import { isShareToStoryAvailable } from "@/lib/telegram/share-story";
import { loadTelegramWebApp } from "@/lib/telegram/webapp";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function JoyShareButton({
  moment,
  lift = null,
}: {
  moment: JoyMoment;
  lift?: JoyLift | null;
}) {
  const [inTelegram, setInTelegram] = useState(false);
  const [storyOk, setStoryOk] = useState(false);
  const [busy, setBusy] = useState<"chat" | "story" | null>(null);
  const [writeKg, setWriteKg] = useState(false);
  const [kgDraft, setKgDraft] = useState(() =>
    lift == null ? "" : formatWeight(lift.kg),
  );
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<JoySharePayload | null>(null);
  const cacheKey = useRef("");

  useEffect(() => {
    void loadTelegramWebApp()
      .then((webApp) => {
        setInTelegram(Boolean(webApp.initData));
        setStoryOk(isShareToStoryAvailable(webApp));
      })
      .catch(() => {
        setInTelegram(false);
        setStoryOk(false);
      });
  }, []);

  useEffect(() => {
    setKgDraft(lift == null ? "" : formatWeight(lift.kg));
  }, [lift]);

  if (!inTelegram) {
    return null;
  }

  const chosenLift = writeKg
    ? sanitizeJoyLift({
        name: lift?.name ?? "",
        kg: parseDecimal(kgDraft) ?? 0,
      })
    : null;

  const liftKey = writeKg
    ? `${chosenLift?.name ?? ""}:${chosenLift?.kg ?? 0}`
    : "off";

  async function loadPayload(): Promise<JoySharePayload | null> {
    const key = `${moment.kind}:${liftKey}`;
    if (cache.current && cacheKey.current === key) {
      return cache.current;
    }
    const payload = await prepareJoyShare(moment, chosenLift);
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
      const result = await shareJoyToChat(moment, chosenLift, payload);
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
      const result = await shareJoyToStory(payload);
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
    <div className="flex flex-col gap-2">
      {writeKg && lift ? (
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 flex-1 truncate text-base">{lift.name}</p>
          <Input
            type="text"
            inputMode="decimal"
            aria-label="кг"
            value={kgDraft}
            onChange={(event) => setKgDraft(event.target.value)}
            className="h-9 w-[4.5rem] px-2 text-right text-base font-semibold tabular-nums md:text-base"
          />
          <span className="text-base text-muted-foreground">кг</span>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={working}
          aria-busy={busy === "chat"}
          onClick={() => void shareChat()}
        >
          {SHARE_TO_CHAT}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          disabled={working || !storyOk}
          aria-busy={busy === "story"}
          onClick={() => void shareStory()}
        >
          {SHARE_STORY_LABEL}
        </Button>
      </div>
      {moment.allowKg && lift ? (
        <button
          type="button"
          className="text-left text-base font-medium text-muted-foreground"
          disabled={working}
          onClick={() => {
            haptic("tick");
            setWriteKg((open) => !open);
          }}
        >
          {writeKg ? SHARE_HIDE_KG : SHARE_WRITE_KG}
        </button>
      ) : null}
      {error ? <p className="text-base leading-snug text-destructive">{error}</p> : null}
    </div>
  );
}
