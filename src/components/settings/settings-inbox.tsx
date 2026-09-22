"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mutateJson } from "@/lib/api-cache";
import { readInboxOpenUrl } from "@/lib/inbox/open-url";
import {
  INBOX_FAILED,
  INBOX_SETTINGS_HINT,
  INBOX_SETTINGS_TITLE,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { openTelegramChat } from "@/lib/telegram/open-chat";

export function SettingsInbox() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void mutateJson("/api/inbox")
      .then((data) => {
        const next = readInboxOpenUrl(data);
        if (!cancelled && next) {
          setUrl(next);
        }
      })
      .catch(() => {
        // The row stays hidden when the mailbox is off.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!url) {
    return null;
  }

  async function onWrite() {
    if (busy || !url) {
      return;
    }

    setBusy(true);
    setError(null);
    haptic("tap");
    try {
      // New start payload every tap — same ?start=w is often ignored in an open chat.
      const next = readInboxOpenUrl(await mutateJson("/api/inbox")) ?? url;
      setUrl(next);
      const opened = await openTelegramChat(next);
      if (!opened) {
        throw new Error(INBOX_FAILED);
      }
    } catch {
      haptic("error");
      setError(INBOX_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">{INBOX_SETTINGS_TITLE}</h2>
      <p className="text-sm text-muted-foreground">{INBOX_SETTINGS_HINT}</p>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy}
        onClick={() => void onWrite()}
      >
        {INBOX_SETTINGS_TITLE}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
