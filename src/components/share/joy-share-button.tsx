"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type JoyLift,
  type JoyMoment,
  SHARE_HIDE_KG,
  SHARE_TO_CHAT,
  SHARE_WRITE_KG,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import {
  shareJoyToChat,
  shareUnavailableMessage,
} from "@/lib/share/share-message";
import { haptic } from "@/lib/telegram/haptic";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function JoyShareButton({
  moment,
  lift = null,
}: {
  moment: JoyMoment;
  lift?: JoyLift | null;
}) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [writeKg, setWriteKg] = useState(false);
  const [kgDraft, setKgDraft] = useState(() =>
    lift == null ? "" : formatWeight(lift.kg),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void import("@twa-dev/sdk")
      .then((sdk) => {
        setAvailable(Boolean(sdk.default.initData));
      })
      .catch(() => {
        setAvailable(false);
      });
  }, []);

  useEffect(() => {
    setKgDraft(lift == null ? "" : formatWeight(lift.kg));
  }, [lift]);

  if (!available) {
    return null;
  }

  const chosenLift = writeKg
    ? sanitizeJoyLift({
        name: lift?.name ?? "",
        kg: parseDecimal(kgDraft) ?? 0,
      })
    : null;

  async function share() {
    setBusy(true);
    setError(null);
    haptic("commit");
    const result = await shareJoyToChat(moment, chosenLift);
    setBusy(false);
    if (result === "failed") {
      setError(shareUnavailableMessage());
    }
  }

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
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy}
        onClick={() => void share()}
      >
        {SHARE_TO_CHAT}
      </Button>
      {moment.allowKg && lift ? (
        <button
          type="button"
          className="text-left text-base font-medium text-muted-foreground"
          disabled={busy}
          onClick={() => {
            haptic("tick");
            setWriteKg((open) => !open);
          }}
        >
          {writeKg ? SHARE_HIDE_KG : SHARE_WRITE_KG}
        </button>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
