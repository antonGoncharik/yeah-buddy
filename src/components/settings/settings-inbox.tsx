"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mutateJson } from "@/lib/api-cache";
import { readInboxOpenUrl } from "@/lib/inbox/open-url";
import { INBOX_SETTINGS_HINT, INBOX_SETTINGS_TITLE } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

export function SettingsInbox() {
  const [url, setUrl] = useState<string | null>(null);

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

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">{INBOX_SETTINGS_TITLE}</h2>
      <p className="text-sm text-muted-foreground">{INBOX_SETTINGS_HINT}</p>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        onClick={() => {
          haptic("tap");
          void openInboxChat(url);
        }}
      >
        {INBOX_SETTINGS_TITLE}
      </Button>
    </section>
  );
}

async function openInboxChat(url: string): Promise<void> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as {
      initData?: string;
      openTelegramLink?: (link: string) => void;
    };
    if (webApp.initData && typeof webApp.openTelegramLink === "function") {
      webApp.openTelegramLink(url);
      return;
    }
  } catch {
    // Outside Telegram the link opens in the browser.
  }

  window.location.assign(url);
}
