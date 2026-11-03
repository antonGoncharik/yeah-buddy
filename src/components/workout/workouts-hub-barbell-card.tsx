"use client";

import { BarbellDoodle } from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { calendarToday } from "@/lib/day/dates";
import {
  BARBELL_GAME_HINT,
  BARBELL_GAME_HREF,
  BARBELL_GAME_TITLE,
} from "@/lib/share/barbell-daily";
import { dailyChallenge, streakDayWord } from "@/lib/workout/barbell-daily";
import { readBarbellDailyProgress } from "@/lib/workout/barbell-daily-storage";
import { plateLabel } from "@/lib/workout/rest-load";

export function WorkoutsHubBarbellCard() {
  const dayKey = calendarToday();
  const challenge = dailyChallenge(dayKey);
  const progress = readBarbellDailyProgress(dayKey);
  if (!challenge) {
    return null;
  }

  const hint = progress.completed
    ? progress.bestMoves != null
      ? `Собрано за ${progress.bestMoves} · улучшить или поделиться`
      : "Собрано · поделиться"
    : `${plateLabel(challenge.targetKg)} кг · ${BARBELL_GAME_HINT}`;

  const streak =
    progress.streak > 0
      ? `Серия ${progress.streak} ${streakDayWord(progress.streak)}`
      : null;
  const line = progress.completed
    ? `${plateLabel(challenge.targetKg)} кг · ${hint}`
    : hint;

  return (
    <NavRow
      href={BARBELL_GAME_HREF}
      title={BARBELL_GAME_TITLE}
      hint={streak ? `${line}. ${streak}` : line}
      icon={<BarbellDoodle />}
    />
  );
}
