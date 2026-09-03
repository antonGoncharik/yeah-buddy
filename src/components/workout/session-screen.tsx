"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { WorkoutSession } from "@/lib/types";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

export function SessionScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${params.id}`);
      if (response.status === 404) {
        setError("Тренировка не найдена.");
        setSession(null);
        return;
      }
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setSession(readSession(data));
    } catch {
      setError(LOAD_FAILED);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: "skipped" | "planned") {
    if (!session) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setSession(readSession(data));
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировка" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error && !session ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && session ? (
          <>
            <section className="card-surface flex flex-col gap-2 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                {session.session_date}
              </p>
              <h2 className="text-2xl font-semibold">
                {WORKOUT_KIND_LABELS[session.workout_type]}
              </h2>
              <p className="text-base text-muted-foreground">
                {SESSION_STATUS_LABELS[session.status]}
              </p>
            </section>

            <p className="text-base text-muted-foreground">
              Подходы появятся на следующем шаге. Сейчас можно пропустить день
              или вернуть тренировку в план.
            </p>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {session.status === "skipped" ? (
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={busy}
                onClick={() => void setStatus("planned")}
              >
                Вернуть в план
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="h-14 text-lg"
                disabled={busy}
                onClick={() => void setStatus("skipped")}
              >
                Пропустить
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function readSession(data: unknown): WorkoutSession | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data.session as WorkoutSession;
}
