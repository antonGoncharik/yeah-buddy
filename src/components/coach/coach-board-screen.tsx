"use client";

import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { MeterBar } from "@/components/ui/meter-bar";
import { mutateJson } from "@/lib/api-cache";
import { readCoachBoard } from "@/lib/coach/parse";
import type { CoachBoard, CoachDay } from "@/lib/coach/types";
import { formatBodyWeight } from "@/lib/day/body-weight";
import { formatIsoDate } from "@/lib/day/format";
import { CATCH_UP_MARK, LOAD_FAILED } from "@/lib/messages";
import { formatGrams, formatKcal, formatMacro } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

export function CoachBoardScreen({ grantId }: { grantId: string }) {
  const [board, setBoard] = useState<CoachBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = readCoachBoard(await mutateJson(`/api/coach/${grantId}`));
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

    function onVisible() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const selected = openDate === "" ? null : (openDate ?? board?.today ?? null);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={board?.athlete_name ?? "Дневник"}
        subtitle={
          board
            ? `Только чтение · до ${formatIsoDate(board.expires_at.slice(0, 10), "d MMMM")}`
            : "Только чтение"
        }
        backHref="/settings/coach"
      />

      <div className="flex flex-col gap-4 px-4 pb-8">
        {loading && !board ? <ScreenLoading /> : null}
        {!loading && error && !board ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {board ? (
          <>
            <p className="text-lg font-medium">
              {weightLine(board) ?? "Веса ещё нет"}
            </p>
            <div className="card-surface divide-y divide-border/70 px-5">
              {board.days.map((day) => (
                <DayBlock
                  key={day.date}
                  day={day}
                  today={board.today}
                  open={day.date === selected}
                  onToggle={() =>
                    setOpenDate((current) => {
                      const active = current ?? board.today;
                      return active === day.date ? "" : day.date;
                    })
                  }
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Живой дневник. Цифры обновляются сами.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function DayBlock({
  day,
  today,
  open,
  onToggle,
}: {
  day: CoachDay;
  today: string;
  open: boolean;
  onToggle: () => void;
}) {
  const facts = [
    foodFact(day),
    day.gym.tone === "none" ? "зала нет" : day.gym.headline,
    day.body_weight == null ? null : `${formatBodyWeight(day.body_weight)} кг`,
  ].filter((item): item is string => item != null);

  return (
    <div className="py-3">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="block text-base font-medium">
            {day.date === today
              ? "Сегодня"
              : formatIsoDate(day.date, "EEEEEE, d MMMM")}
            {day.caught_up ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {CATCH_UP_MARK}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {facts.join(" · ")}
          </span>
        </span>
      </button>
      {open ? <DayDetail day={day} /> : null}
    </div>
  );
}

function DayDetail({ day }: { day: CoachDay }) {
  const proteinRatio =
    day.target_protein > 0 ? day.protein / day.target_protein : 0;

  return (
    <div className="mt-3 flex flex-col gap-4">
      {day.target_protein > 0 || day.protein > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>Белок {formatMacro(day.protein)} г</span>
            <span className="text-muted-foreground">
              {day.target_protein > 0
                ? `цель ${formatMacro(day.target_protein)} г`
                : formatKcal(day.kcal)}
            </span>
          </div>
          {day.target_protein > 0 ? (
            <MeterBar ratio={proteinRatio} barClass="bg-primary" size="sm" />
          ) : null}
          <p className="text-sm text-muted-foreground">
            {formatKcal(day.kcal)}
            {day.target_kcal > 0 ? ` / ${formatKcal(day.target_kcal)}` : ""}{" "}
            ккал
            {day.protein_short ? " · белок ниже цели" : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Еды нет</p>
      )}

      {day.meals.length > 0 ? (
        <div className="flex flex-col gap-3">
          {day.meals.map((meal) => (
            <div key={meal.label}>
              <p className="text-sm font-medium">{meal.label}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {meal.items.map((item) => (
                  <li
                    key={mealLineKey(meal.label, item)}
                    className="text-sm text-muted-foreground"
                  >
                    {item.name} · {formatGrams(item.grams)} г · Б{" "}
                    {formatMacro(item.protein)} · {formatKcal(item.kcal)} ккал
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <p
          className={cn(
            "text-sm font-medium",
            (day.gym.tone === "short" || day.gym.tone === "miss") &&
              "text-destructive",
          )}
        >
          {day.gym.title
            ? `${day.gym.title} · ${day.gym.headline}`
            : day.gym.headline}
        </p>
        {day.gym.lines.length > 0 ? (
          <ul className="mt-1 flex flex-col gap-1">
            {day.gym.lines.map((line) => (
              <li key={line} className="text-sm text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function mealLineKey(
  label: string,
  item: CoachDay["meals"][number]["items"][number],
): string {
  return `${label}:${item.name}:${item.grams}:${item.protein}:${item.kcal}`;
}

function foodFact(day: CoachDay): string {
  if (day.protein <= 0 && day.kcal <= 0) {
    return "еды нет";
  }
  if (day.target_protein > 0) {
    return `белок ${formatMacro(day.protein)} / ${formatMacro(day.target_protein)} г`;
  }
  return `белок ${formatMacro(day.protein)} г`;
}

function weightLine(board: CoachBoard): string | null {
  if (!board.weight) {
    return null;
  }
  const kg = `${formatBodyWeight(board.weight.kg)} кг`;
  if (board.weight.date === board.today) {
    return `Утро ${kg}`;
  }
  return `${kg} · ${formatIsoDate(board.weight.date, "d MMMM")}`;
}
