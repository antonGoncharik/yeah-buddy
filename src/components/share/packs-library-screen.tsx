"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import {
  DumbbellDoodle,
  MealDayDoodle,
  FriendsDoodle,
} from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PublishPackButton } from "@/components/share/publish-pack-button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { cachedGet, mutateJson } from "@/lib/api-cache";
import {
  LOAD_FAILED,
  PACK_REMOVE_LINK,
  PACK_REMOVE_SAVED,
} from "@/lib/messages";
import { readSharePacksPayload } from "@/lib/share/map";
import { removePackFromListCache } from "@/lib/share/pack-cache";
import { packPath } from "@/lib/share/pending";
import type { SharePackSummary } from "@/lib/share/types";
import { haptic } from "@/lib/telegram/haptic";
import { useFirstLoad } from "@/lib/use-first-load";
import { PACKS_LABEL } from "@/lib/workout/labels";

export function PacksLibraryScreen() {
  const confirm = useConfirm();
  const [packs, setPacks] = useState<SharePackSummary[]>([]);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    begin();
    setError(null);
    try {
      await cachedGet(
        "/api/packs",
        (data) => {
          setPacks(readSharePacksPayload(data));
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setPacks([]);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRevoke(pack: SharePackSummary) {
    const ok = await confirm({
      message: pack.received ? PACK_REMOVE_SAVED : PACK_REMOVE_LINK,
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setRevokingToken(pack.token);
    try {
      await mutateJson(`/api/packs/${pack.token}/revoke`, { method: "POST" });
      removePackFromListCache(pack.token);
      setPacks((current) => current.filter((row) => row.token !== pack.token));
      haptic("commit");
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setRevokingToken(null);
    }
  }

  const listBusy = revokingToken != null;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={PACKS_LABEL} backHref="/settings" />

      <div className="flex flex-col gap-4 px-4 pb-36">
        <p className="text-base text-muted-foreground">
          Едой на день, одним приёмом и программой тренировок делишься
          отдельными ссылками и QR. В ссылку попадают только шаблоны и строки
          приёма — записи из дневника и рабочие веса остаются у тебя. Ссылку
          можно убрать — она перестанет открываться. Ссылки от друзей
          сохраняются сюда, поставить их можно когда удобно.
        </p>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && packs.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && packs.length === 0 ? (
          <EmptyNote
            icon={<FriendsDoodle className="h-8 w-8" />}
            title="Пока пусто."
            hint="Поделись обедом, едой на день или программой — ссылка появится здесь."
          />
        ) : null}

        {!loading && packs.length > 0 ? (
          <section className="card-surface animate-rise divide-y divide-border/70 px-3 py-1">
            {packs.map((pack) => (
              <div key={pack.id} className="flex items-center gap-1">
                <Link
                  href={packPath(pack.token, "packs")}
                  className="min-w-0 flex-1 rounded-xl px-2 py-2.5 transition-colors duration-200 ease-[var(--ease-out-soft)] hover:bg-muted/40"
                >
                  <p className="truncate text-lg font-medium">{pack.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {packHint(pack)}
                  </p>
                </Link>
                <RemoveRowButton
                  label={pack.received ? "Убрать из списка" : "Убрать ссылку"}
                  disabled={listBusy}
                  onClick={() => void onRevoke(pack)}
                />
              </div>
            ))}
          </section>
        ) : null}

        {!loading && error && packs.length > 0 ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      {!loading ? (
        <StickyActions>
          <PublishPackButton kind="meals" from="packs" />
          <PublishPackButton kind="workouts" from="packs" />
        </StickyActions>
      ) : null}
    </div>
  );
}

function packHint(pack: SharePackSummary): string {
  const kind =
    pack.kind === "workouts"
      ? "Тренировки"
      : pack.kind === "meals"
        ? "Еда"
        : "Приём";
  return `${kind} · ${pack.hint}`;
}
