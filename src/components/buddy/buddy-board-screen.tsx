"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { readBuddyBoard } from "@/lib/buddy/parse";
import type { BuddyTodayBoard } from "@/lib/buddy/types";
import { formatIsoDate } from "@/lib/day/format";
import { mutateJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

export function BuddyBoardScreen({ grantId }: { grantId: string }) {
  const [board, setBoard] = useState<BuddyTodayBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = readBuddyBoard(await mutateJson(`/api/buddy/${grantId}`));
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      setBoard(next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [grantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load();
      }
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={board?.athlete_name ?? "День друга"}
        subtitle={
          board
            ? `Только сегодня · до ${formatIsoDate(board.expires_at.slice(0, 10), "d MMMM")}`
            : "Без веса и цифр"
        }
        backHref="/settings/buddy"
      />

      <div className="flex flex-col gap-4 px-4 pb-8">
        {loading && !board ? <ScreenLoading /> : null}
        {!loading && error && !board ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {board ? (
          <section className="card-surface flex flex-col gap-4 px-5 py-5">
            <p className="text-sm text-muted-foreground">
              {formatIsoDate(board.date, "d MMMM")}
            </p>
            <div className="grid gap-3">
              <StatusRow
                label="Еда"
                ok={board.food_logged}
                okText="Записал"
                noText="Пока пусто"
              />
              <StatusRow
                label="Белок"
                ok={board.protein_ok}
                okText="В цели"
                noText="Ещё нет"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-medium">Зал</span>
                <span className="text-right text-base text-muted-foreground">
                  {board.gym.label}
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  okText,
  noText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  noText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-medium">{label}</span>
      <span
        className={cn(
          "text-base font-medium",
          ok ? "text-primary" : "text-muted-foreground",
        )}
      >
        {ok ? okText : noText}
      </span>
    </div>
  );
}
