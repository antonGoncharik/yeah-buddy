"use client";

import {
  type barbellDailyGrade,
  barbellDailyGradeLine,
  formatSidePlateStack,
  plateCountWord,
} from "@/lib/workout/barbell-daily";

export function BarbellDailyResultSummary({
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
