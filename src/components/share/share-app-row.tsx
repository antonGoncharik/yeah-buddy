"use client";

import { useState } from "react";

import { NavRow } from "@/components/layout/nav-row";
import { mutateJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { shareOrCopyLink } from "@/lib/share/client";
import { readInvitePayload } from "@/lib/share/invite";

export function ShareAppRow() {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onShare() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const invite = readInvitePayload(await mutateJson("/api/invite"));
      if (!invite) {
        setError(LOAD_FAILED);
        return;
      }

      const result = await shareOrCopyLink(invite.url, invite.text);
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <NavRow
      title="Показать дневник"
      hint={
        error ??
        (copied
          ? "Ссылка скопирована."
          : "Ссылка на приложение, без твоей еды и зала")
      }
      busy={busy}
      onClick={() => void onShare()}
    />
  );
}
