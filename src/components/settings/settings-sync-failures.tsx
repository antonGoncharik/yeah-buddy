"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type DeadOutboxOp,
  deadOutboxCount,
  listDeadOutbox,
  removeDeadOutbox,
  retryAllDeadOutbox,
  retryDeadOutbox,
  subscribeDeadOutbox,
} from "@/lib/outbox-dead";
import { flushOutbox } from "@/lib/outbox-flush";
import { haptic } from "@/lib/telegram/haptic";

export function SettingsSyncFailures() {
  const [dead, setDead] = useState<DeadOutboxOp[]>(() => listDeadOutbox());

  useEffect(() => {
    setDead(listDeadOutbox());
    return subscribeDeadOutbox(setDead);
  }, []);

  if (dead.length === 0) {
    return null;
  }

  const count = deadOutboxCount();

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-base font-semibold">
        Не удалось синхронизировать: {count}
      </h2>
      <p className="text-sm text-muted-foreground">
        Эти записи не ушли на сервер. Остальная очередь продолжает
        синхронизироваться.
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {dead.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-border/60 px-3 py-2"
          >
            <p className="font-medium">{labelForDeadOp(row)}</p>
            {row.status != null ? (
              <p className="text-muted-foreground">Код {row.status}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 min-h-11"
                onClick={() => {
                  if (retryDeadOutbox(row.id)) {
                    haptic("commit");
                    void flushOutbox();
                  }
                }}
              >
                Повторить
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 min-h-11"
                onClick={() => {
                  removeDeadOutbox(row.id);
                  haptic("tap");
                }}
              >
                Удалить
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        className="h-12 text-base"
        onClick={() => {
          retryAllDeadOutbox();
          haptic("commit");
          void flushOutbox();
        }}
      >
        Повторить все
      </Button>
    </section>
  );
}

function labelForDeadOp(row: DeadOutboxOp): string {
  if (row.url.includes("/meal")) {
    return "Запись еды";
  }
  if (row.url.includes("/sessions")) {
    return "Тренировка";
  }
  if (row.url.startsWith("/api/days")) {
    return "День";
  }
  return `${row.method} ${row.url}`;
}
