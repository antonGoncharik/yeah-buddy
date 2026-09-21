"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { ShareQr } from "@/components/share/share-qr";
import { Button } from "@/components/ui/button";
import { mutateJson } from "@/lib/api-cache";
import { INVITE_QR_CAPTION } from "@/lib/flavor";
import { LOAD_FAILED } from "@/lib/messages";
import { shareOrCopyLink } from "@/lib/share/client";
import {
  BOT_INVITE_LABEL,
  BOT_INVITE_SUBTITLE,
  readInvitePayload,
} from "@/lib/share/invite";
import { isTelegramMeUrl } from "@/lib/telegram/share-url";

export function ShareInviteScreen() {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const invite = readInvitePayload(await mutateJson("/api/invite"));
      if (!invite) {
        throw new Error(LOAD_FAILED);
      }
      setUrl(invite.url);
      setText(invite.text);
    } catch (caught) {
      setUrl(null);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onShare() {
    if (!url) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await shareOrCopyLink(url, text);
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const showQr = url != null && isTelegramMeUrl(url);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={BOT_INVITE_LABEL}
        subtitle={BOT_INVITE_SUBTITLE}
        backHref="/settings"
      />

      <div className="flex flex-col gap-4 px-4 pb-36">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !url ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && url ? (
          <>
            {showQr ? <ShareQr url={url} caption={INVITE_QR_CAPTION} /> : null}
            <p className="text-base leading-relaxed text-muted-foreground">
              {showQr
                ? "Если человек уже в Telegram — «Поделиться» отправит ссылку на бот."
                : "«Поделиться» отправит ссылку."}
            </p>
            {copied ? (
              <p className="animate-fade text-sm text-muted-foreground">
                Ссылка скопирована.
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </>
        ) : null}
      </div>

      {!loading && url ? (
        <StickyActions>
          <Button
            className="h-14 w-full text-lg"
            disabled={busy}
            onClick={() => void onShare()}
          >
            Поделиться
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}
