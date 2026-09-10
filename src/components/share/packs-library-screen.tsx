"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { PublishPackButton } from "@/components/share/publish-pack-button";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { readSharePacksPayload } from "@/lib/share/map";
import { packPath } from "@/lib/share/pending";
import type { SharePackSummary } from "@/lib/share/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { PACKS_LABEL } from "@/lib/workout/labels";

export function PacksLibraryScreen() {
  const [packs, setPacks] = useState<SharePackSummary[]>([]);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title={PACKS_LABEL} backHref="/settings" />

      <div className="flex flex-col gap-4 px-4 pb-36">
        <p className="text-base text-muted-foreground">
          Еда и зал — отдельные ссылки. Свои шаблоны, не дневник и не веса.
          Чужое сохраняется сюда, поставить можно когда удобно.
        </p>

        {loading ? <ScreenLoading /> : null}

        {!loading && error && packs.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && packs.length === 0 ? (
          <p className="animate-rise px-1 text-base leading-relaxed text-muted-foreground">
            Пока пусто. Поделись едой на день или очередью зала — ссылка
            останется здесь.
          </p>
        ) : null}

        {!loading && packs.length > 0 ? (
          <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
            {packs.map((pack) => (
              <NavRow
                key={pack.id}
                href={packPath(pack.token, "packs")}
                title={pack.title}
                hint={packHint(pack)}
              />
            ))}
          </section>
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
  const kind = pack.kind === "meals" ? "Еда" : "Зал";
  if (pack.revoked) {
    return `${kind} · ссылка выключена`;
  }
  return `${kind} · ${pack.hint}`;
}
