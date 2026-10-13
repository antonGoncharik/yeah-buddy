"use client";

import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { BarbellDailyShare } from "@/components/share/barbell-daily-share";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { BarbellBalanceGame } from "@/components/workout/barbell-balance-game";
import { BarbellDailyGame } from "@/components/workout/barbell-daily-game";
import { BarbellPendulumGame } from "@/components/workout/barbell-pendulum-game";
import { calendarToday } from "@/lib/day/dates";
import { BALANCE_RULES, balanceDeal } from "@/lib/workout/barbell-balance";
import {
  BARBELL_DAILY_RULES,
  type BarbellDailyChallenge,
  barbellDailyGrade,
  barbellDailyGradeLine,
  dailyChallenge,
  formatMissingRack,
  formatRack,
  formatSidePlateStack,
  plateCountWord,
  streakDayWord,
} from "@/lib/workout/barbell-daily";
import { readBarbellDailyProgress } from "@/lib/workout/barbell-daily-storage";
import { PENDULUM_RULES } from "@/lib/workout/barbell-pendulum";
import { plateLabel } from "@/lib/workout/rest-load";

type BarbellMode = "rack" | "balance" | "pendulum";

const MODE_OPTIONS: Array<{ id: BarbellMode; label: string }> = [
  { id: "rack", label: "Стойка" },
  { id: "balance", label: "Ровно" },
  { id: "pendulum", label: "Маятник" },
];

const MODE_SUBTITLE: Record<BarbellMode, string> = {
  rack: "Задача дня",
  balance: "Баланс",
  pendulum: "Башня",
};

const MODE_RULES: Record<BarbellMode, string> = {
  rack: BARBELL_DAILY_RULES,
  balance: BALANCE_RULES,
  pendulum: PENDULUM_RULES,
};

export function BarbellDailyScreen() {
  const dayKey = calendarToday();
  const challenge = useMemo(
    () => dailyChallenge(dayKey),
    [dayKey],
  ) as BarbellDailyChallenge | null;
  const pile = useMemo(
    () => (challenge ? balanceDeal(challenge.parPlates, challenge.dayKey) : []),
    [challenge],
  );
  const [mode, setMode] = useState<BarbellMode>("rack");
  const [progress, setProgress] = useState(() =>
    readBarbellDailyProgress(dayKey),
  );
  const [round, setRound] = useState(0);
  const [win, setWin] = useState<{
    moves: number;
    streak: number;
    grade: ReturnType<typeof barbellDailyGrade>;
  } | null>(null);

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
  const missing = formatMissingRack(challenge.rack);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Собери штангу" subtitle={MODE_SUBTITLE[mode]} />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <Segmented value={mode} options={MODE_OPTIONS} onChange={setMode} />
        <p className="text-sm leading-snug text-muted-foreground">
          {MODE_RULES[mode]}
        </p>

        <div className={mode === "rack" ? "flex flex-col gap-4" : "hidden"}>
          <section className="card-surface flex flex-col gap-3 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Цель</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {plateLabel(challenge.targetKg)} кг
              </p>
            </div>
            <p className="text-sm leading-snug text-muted-foreground">
              На стойке: {formatRack(challenge.rack)}
            </p>
            {missing ? (
              <p className="text-sm text-muted-foreground">Нет {missing}</p>
            ) : null}
            {progress.streak > 0 ? (
              <p className="text-sm text-muted-foreground">
                Серия {progress.streak} {streakDayWord(progress.streak)}
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
              onWin={({ moves, streak, grade }) => {
                setWin({ moves, streak, grade });
                setProgress(readBarbellDailyProgress(dayKey));
              }}
            />
            {showShare ? (
              <ResultSummary
                moves={win?.moves ?? progress.bestMoves ?? challenge.parMoves}
                parMoves={challenge.parMoves}
                grade={
                  win?.grade ??
                  barbellDailyGrade(
                    progress.bestMoves ?? challenge.parMoves,
                    challenge.parMoves,
                  )
                }
                parPlates={challenge.parPlates}
              />
            ) : null}
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
                В чат или сторис — с кнопкой в дневник. Пусть тоже соберут
                штангу.
              </p>
              <BarbellDailyShare
                facts={{
                  dayKey: challenge.dayKey,
                  targetKg: challenge.targetKg,
                  moves: win?.moves ?? progress.bestMoves ?? challenge.parMoves,
                  parMoves: challenge.parMoves,
                }}
              />
            </section>
          ) : null}
        </div>

        {mode === "balance" ? (
          <section className="card-surface flex flex-col gap-3 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Цель</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {plateLabel(challenge.targetKg)} кг
              </p>
            </div>
            <BarbellBalanceGame
              key={challenge.dayKey}
              targetKg={challenge.targetKg}
              pile={pile}
            />
          </section>
        ) : null}

        {mode === "pendulum" ? (
          <section className="card-surface flex flex-col gap-3 px-5 py-4">
            <BarbellPendulumGame />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ResultSummary({
  moves,
  parMoves,
  grade,
  parPlates,
}: {
  moves: number;
  parMoves: number;
  grade: ReturnType<typeof barbellDailyGrade>;
  parPlates: number[];
}) {
  const overPar = moves - parMoves;
  const detail =
    overPar <= 0
      ? "В пар."
      : overPar === 1
        ? "+1 к пару."
        : `+${overPar} к пару.`;

  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
      <p className="font-medium">{barbellDailyGradeLine(grade)}</p>
      <p className="mt-1 text-muted-foreground">
        {moves} {plateCountWord(moves)} · {detail}
      </p>
      <p className="mt-1 text-muted-foreground">
        Пар на сторону: {formatSidePlateStack(parPlates)}
      </p>
    </div>
  );
}
