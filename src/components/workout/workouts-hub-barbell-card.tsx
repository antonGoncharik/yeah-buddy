"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { BarbellDoodle } from "@/components/layout/doodles";
import { MarkBadge } from "@/components/layout/mark-badge";
import { calendarToday } from "@/lib/day/dates";
import {
  BARBELL_GAME_HINT,
  BARBELL_GAME_HREF,
  BARBELL_GAME_TITLE,
} from "@/lib/share/barbell-daily";
import { dailyChallenge } from "@/lib/workout/barbell-daily";
import { readBarbellDailyProgress } from "@/lib/workout/barbell-daily-storage";
import { plateLabel } from "@/lib/workout/rest-load";

export function WorkoutsHubBarbellCard() {
  const dayKey = calendarToday();
  const challenge = dailyChallenge(dayKey);
  const progress = readBarbellDailyProgress(dayKey);
  if (!challenge || progress.completed) {
    return null;
  }

  return (
    <Link
      href={BARBELL_GAME_HREF}
      className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <MarkBadge className="size-10 rounded-xl">
        <BarbellDoodle />
      </MarkBadge>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold">
          {BARBELL_GAME_TITLE}
        </span>
        <span className="block text-sm text-muted-foreground">
          {plateLabel(challenge.targetKg)} кг · {BARBELL_GAME_HINT}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
