"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { mutateJson, postJson } from "@/lib/api-cache";
import {
  DONATE_PRESETS,
  DONATE_MAX,
  DONATE_MIN,
  donateConfirmMessage,
  donateNeedsConfirm,
  donateStarsLabel,
  isDonateInvoiceUrl,
  parseDonateStars,
} from "@/lib/donate/amount";
import { openDonateInvoice } from "@/lib/donate/open";
import { sanitizeIntegerDraft } from "@/lib/form/numeric-draft";
import {
  DONATE_HINT,
  DONATE_STARS_INVALID,
  DONATE_THANKS,
  LOAD_FAILED,
  OPEN_VIA_BOT,
} from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

function readInvoiceUrl(data: unknown): string | null {
  if (!isRecord(data) || typeof data.url !== "string") {
    return null;
  }
  return isDonateInvoiceUrl(data.url) ? data.url : null;
}

function readDonateOpen(data: unknown): boolean {
  return isRecord(data) && data.open === true;
}

export function SettingsAuthor() {
  const confirm = useConfirm();
  const pending = useRef(false);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starsTouched, setStarsTouched] = useState(false);
  const customStars = parseDonateStars(custom);
  const starsInvalid =
    starsTouched &&
    custom.trim() !== "" &&
    customStars == null;

  useEffect(() => {
    let cancelled = false;
    void mutateJson("/api/donate")
      .then((data) => {
        if (!cancelled && readDonateOpen(data)) {
          setOpen(true);
        }
      })
      .catch(() => {
        // Hidden when the check fails, same as «Написать».
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!open) {
    return null;
  }

  async function pay(stars: number) {
    if (pending.current || parseDonateStars(String(stars)) !== stars) {
      return;
    }

    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      if (donateNeedsConfirm(stars)) {
        const ok = await confirm({
          message: donateConfirmMessage(stars),
          confirmLabel: "Оплатить",
          cancelLabel: "Назад",
        });
        if (!ok) {
          return;
        }
      }

      const url = readInvoiceUrl(await postJson("/api/donate", { stars }));
      if (!url) {
        throw new Error(LOAD_FAILED);
      }

      const result = await openDonateInvoice(url);
      if (result === "paid") {
        haptic("success");
        setThanks(true);
        setCustom("");
        return;
      }
      if (result === "unavailable") {
        haptic("error");
        setError(OPEN_VIA_BOT);
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function onCustom(event: FormEvent) {
    event.preventDefault();
    setStarsTouched(true);
    if (custom.trim() === "" || customStars == null) {
      haptic("warn");
      setError(DONATE_STARS_INVALID);
      return;
    }
    setError(null);
    void pay(customStars);
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Автору</h2>
      <p className="text-sm text-muted-foreground">{DONATE_HINT}</p>
      <div className="grid grid-cols-3 gap-2">
        {DONATE_PRESETS.map((stars) => (
          <Button
            key={stars}
            type="button"
            variant="secondary"
            className="h-12 text-lg"
            disabled={busy}
            onClick={() => void pay(stars)}
          >
            {donateStarsLabel(stars)}
          </Button>
        ))}
      </div>
      <form className="flex flex-col gap-1.5" onSubmit={onCustom}>
        <label
          className="text-sm text-muted-foreground"
          htmlFor="donate-custom"
        >
          Сколько звёзд
        </label>
        <span className="flex gap-2">
          <input
            id="donate-custom"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={custom}
            disabled={busy}
            aria-invalid={starsInvalid || undefined}
            onChange={(event) => {
              setCustom(sanitizeIntegerDraft(event.target.value));
              setThanks(false);
              setError(null);
              setStarsTouched(true);
            }}
            className={cn(
              "field-control h-12 min-w-0 flex-1 rounded-xl border border-input/70 bg-input-bg px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              starsInvalid &&
                "border-destructive ring-3 ring-destructive/20 focus-visible:border-destructive",
            )}
          />
          <Button
            type="submit"
            variant="secondary"
            className="h-12 px-4 text-base"
            disabled={busy}
          >
            Ок
          </Button>
        </span>
        {starsInvalid ? (
          <p className="text-sm text-destructive">
            {DONATE_STARS_INVALID}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            От {DONATE_MIN}–{DONATE_MAX.toLocaleString("ru-RU")}.
          </p>
        )}
      </form>
      {thanks ? <p className="text-lg font-medium">{DONATE_THANKS}</p> : null}
      {error && !starsInvalid ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </section>
  );
}
