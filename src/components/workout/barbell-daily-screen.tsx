"use client";

import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { BarbellDailyShare } from "@/components/share/barbell-daily-share";
import { Button } from "@/components/ui/button";
import { BarbellDailyGame } from "@/components/workout/barbell-daily-game";
import { calendarToday } from "@/lib/day/dates";
import {
  type BarbellDailyChallenge,
  dailyChallenge,
} from "@/lib/workout/barbell-daily";
import { readBarbellDailyProgress } from "@/lib/workout/barbell-daily-storage";
import { plateLabel } from "@/lib/workout/rest-load";

export function BarbellDailyScreen() {
  const dayKey = calendarToday();
  const challenge = useMemo(
    () => dailyChallenge(dayKey),
    [dayKey],
  ) as BarbellDailyChallenge | null;
  const [progress, setProgress] = useState(() =>
    readBarbellDailyProgress(dayKey),
  );
  const [round, setRound] = useState(0);
  const [win, setWin] = useState<{ moves: number; streak: number } | null>(
    null,
  );

  if (!challenge) {
    return (
      <div className="flex flex-col gap-4">
        <AppHeader title="Собери штангу" />
        <p className="px-4 text-base text-muted-foreground">
          Задача дня не собралась — загляни завтра.
        </p>
      </div>
    );
  }

  const showShare = win != null || progress.completed;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Собери штангу" subtitle="Задача дня" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <section className="card-surface flex flex-col gap-3 px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Цель</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {plateLabel(challenge.targetKg)} кг
            </p>
          </div>
          {progress.streak > 0 ? (
            <p className="text-sm text-muted-foreground">
              Серия {progress.streak} {streakWord(progress.streak)}
            </p>
          ) : null}
          {progress.bestMoves != null && progress.completed && win == null ? (
            <p className="text-sm text-muted-foreground">
              Сегодня уже собрал за {progress.bestMoves} — можно лучше или
              поделиться.
            </p>
          ) : null}
          <BarbellDailyGame
            key={round}
            challenge={challenge}
            onWin={({ moves, streak }) => {
              setWin({ moves, streak });
              setProgress(readBarbellDailyProgress(dayKey));
            }}
          />
          {progress.completed ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 text-base"
              onClick={() => {
                setWin(null);
                setRound((value) => value + 1);
              }}
            >
              Ещё раз
            </Button>
          ) : null}
        </section>

        {showShare ? (
          <section className="card-surface flex flex-col gap-3 px-5 py-4">
            <p className="text-base font-medium">Кинуть друзьям</p>
            <p className="text-sm leading-snug text-muted-foreground">
              В чат или сторис — с кнопкой в дневник. Пусть тоже соберут штангу.
            </p>
            <BarbellDailyShare
              facts={{
                dayKey: challenge.dayKey,
                targetKg: challenge.targetKg,
                moves: win?.moves ?? progress.bestMoves ?? challenge.parMoves,
              }}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function streakWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "день";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "дня";
  }
  return "дней";
}
