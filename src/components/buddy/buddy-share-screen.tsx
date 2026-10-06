"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { SectionHeading } from "@/components/layout/section-heading";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteJson, mutateJson, postJson } from "@/lib/api-cache";
import { readBuddyHome, readBuddyIssue } from "@/lib/buddy/parse";
import type { BuddyGrantView, BuddyHome } from "@/lib/buddy/types";
import { formatIsoDate } from "@/lib/day/format";
import { LOAD_FAILED } from "@/lib/messages";
import { shareOrCopyLink } from "@/lib/share/client";
import { haptic } from "@/lib/telegram/haptic";

export function BuddyShareScreen() {
  const confirm = useConfirm();
  const [home, setHome] = useState<BuddyHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const next = readBuddyHome(await mutateJson("/api/buddy"));
    if (!next) {
      throw new Error(LOAD_FAILED);
    }
    setHome(next);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await reload();
    } catch (caught) {
      setHome(null);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [reload]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onShare() {
    setBusy(true);
    setError(null);
    setNote(null);
    haptic("tap");
    try {
      const issued = readBuddyIssue(await postJson("/api/buddy", {}));
      if (!issued) {
        throw new Error(LOAD_FAILED);
      }
      try {
        const result = await shareOrCopyLink(issued.url, issued.text);
        if (result === "copied") {
          setNote("Ссылка скопирована.");
        } else if (result === "shared") {
          setNote("Ссылка готова.");
        }
      } catch {
        setNote("Ссылка есть. Отсюда не отправилась — нажми ещё раз.");
      }
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onRenew(grant: BuddyGrantView) {
    setError(null);
    setNote(null);
    try {
      await postJson(`/api/buddy/${grant.id}/renew`, {});
      setNote("Продлено на 30 дней.");
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function onRevoke(grant: BuddyGrantView) {
    const ok = await confirm({
      message: "Закрыть доступ? Пара больше не увидит дневник.",
      confirmLabel: "Закрыть",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setError(null);
    setNote(null);
    try {
      await deleteJson(`/api/buddy/${grant.id}`);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  const waiting = home?.outgoing.some((grant) => !grant.claimed) === true;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Пара" subtitle="Только чтение" backHref="/settings" />

      <div className="flex flex-col gap-6 px-4 pb-36">
        {loading ? <ScreenLoading /> : null}
        {!loading && error && !home ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && home ? (
          <>
            <p className="text-base leading-relaxed text-muted-foreground">
              Пара открывает YeahBuddy у себя и видит еду, зал и утренний вес.
              Менять дневник он не может. Ссылка живёт 30 дней.
            </p>

            {home.outgoing.length > 0 ? (
              <section className="flex flex-col gap-2">
                <SectionHeading title="Кому открыт" />
                <div className="card-surface flex flex-col divide-y divide-border/70 px-5">
                  {home.outgoing.map((grant) => (
                    <GrantRow
                      key={grant.id}
                      grant={grant}
                      onRenew={() => void onRenew(grant)}
                      onRevoke={() => void onRevoke(grant)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {home.athletes.length > 0 ? (
              <section className="flex flex-col gap-2">
                <SectionHeading title="Подопечные" />
                <div className="card-surface divide-y divide-border/70 px-5 py-2">
                  {home.athletes.map((athlete) => (
                    <NavRow
                      key={athlete.id}
                      href={`/buddy/${athlete.id}`}
                      title={athlete.person}
                      hint={`до ${untilLabel(athlete.expires_at)}`}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {note ? (
              <p className="animate-fade text-sm text-muted-foreground">
                {note}
              </p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </>
        ) : null}
      </div>

      {!loading && home ? (
        <StickyActions>
          <Button
            className="h-14 w-full text-lg"
            disabled={busy}
            onClick={() => void onShare()}
          >
            {waiting ? "Отправить ещё раз" : "Отправить другу"}
          </Button>
        </StickyActions>
      ) : null}
    </div>
  );
}

function GrantRow({
  grant,
  onRenew,
  onRevoke,
}: {
  grant: BuddyGrantView;
  onRenew: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-lg font-medium">
          {grant.person ?? "Ещё не открыл"}
        </p>
        <p className="shrink-0 text-sm text-muted-foreground">
          до {untilLabel(grant.expires_at)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onRenew}>
          Продлить
        </Button>
        <Button variant="destructive" onClick={onRevoke}>
          Закрыть
        </Button>
        <Link
          href={`/buddy/${grant.id}`}
          className={buttonVariants({ variant: "ghost" })}
        >
          Как увидит
        </Link>
      </div>
    </div>
  );
}

function untilLabel(iso: string): string {
  const date = iso.slice(0, 10);
  return formatIsoDate(date, "d MMMM");
}
