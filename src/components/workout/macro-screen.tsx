"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { CurrentMacroState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function MacroScreen() {
  const [state, setState] = useState<CurrentMacroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/macros");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      const next = readState(data);
      setState(next);
      setDrafts(
        Object.fromEntries(
          (next?.maxes ?? []).map((row) => [
            row.exercise.id,
            row.phase_max ? formatWeight(row.phase_max.max_weight) : "",
          ]),
        ),
      );
    } catch {
      setError(LOAD_FAILED);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveMax(exerciseId: string) {
    if (!state?.phase) {
      return;
    }

    const weight = parseDecimal(drafts[exerciseId] ?? "");
    if (weight == null || weight <= 0) {
      setError("Проверьте максимум.");
      return;
    }

    setSavingId(exerciseId);
    setError(null);

    try {
      const response = await fetch(`/api/phases/${state.phase.id}/maxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exerciseId,
          max_weight: weight,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      await load();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Макроцикл" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error && !state ? (
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

        {!loading && state && !state.macro ? (
          <section className="card-surface flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">Макроцикла ещё нет.</p>
            <Link
              href="/workouts/macro/new"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Создать макроцикл
            </Link>
          </section>
        ) : null}

        {!loading && state?.macro && state.phase ? (
          <>
            <section className="card-surface flex flex-col gap-2 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                Макроцикл №{state.macro.number}
              </p>
              <h2 className="text-2xl font-semibold">
                {PHASE_TYPE_LABELS[state.phase.phase_type]}
              </h2>
              <p className="text-sm text-muted-foreground">
                с {state.phase.start_date}
              </p>
              <ol className="mt-2 flex flex-wrap gap-2">
                {state.phases.map((phase) => (
                  <li
                    key={phase.id}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm",
                      phase.status === "current"
                        ? "bg-primary/12 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {PHASE_TYPE_LABELS[phase.phase_type]}
                  </li>
                ))}
              </ol>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Максимумы фазы</h2>
              {state.maxes.map((row) => (
                <div
                  key={row.exercise.id}
                  className="card-surface flex flex-col gap-3 px-5 py-4"
                >
                  <p className="text-lg font-medium">
                    {row.exercise.short_name || row.exercise.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Рекорд{" "}
                    {row.exercise.current_max
                      ? `${formatWeight(row.exercise.current_max.max_weight)} кг`
                      : "—"}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      inputMode="decimal"
                      value={drafts[row.exercise.id] ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.exercise.id]: event.target.value,
                        }))
                      }
                      className="h-12 text-base"
                    />
                    <Button
                      type="button"
                      className="h-12 px-4 text-base"
                      disabled={savingId === row.exercise.id}
                      onClick={() => void saveMax(row.exercise.id)}
                    >
                      {savingId === row.exercise.id ? "…" : "Ок"}
                    </Button>
                  </div>
                </div>
              ))}
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function readState(data: unknown): CurrentMacroState | null {
  if (!data || typeof data !== "object" || !("macro" in data)) {
    return null;
  }

  return data as CurrentMacroState;
}
