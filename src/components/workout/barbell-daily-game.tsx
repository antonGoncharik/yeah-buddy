"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadBar } from "@/components/workout/load-bar";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  type BarbellDailyChallenge,
  barbellDailyGrade,
  barbellDailyGradeLine,
  movesHitTarget,
} from "@/lib/workout/barbell-daily";
import { recordBarbellDailyWin } from "@/lib/workout/barbell-daily-storage";
import {
  addSidePlate,
  loadedKg,
  loadStatus,
  plateLabel,
  REST_LOAD_OVER_LINE,
  SIDE_PLATES,
  undoSidePlate,
} from "@/lib/workout/rest-load";

export function BarbellDailyGame({
  challenge,
  onWin,
}: {
  challenge: BarbellDailyChallenge;
  onWin: (input: {
    moves: number;
    grade: ReturnType<typeof barbellDailyGrade>;
    streak: number;
  }) => void;
}) {
  const [plates, setPlates] = useState<number[]>([]);
  const targetKg = challenge.targetKg;
  const currentKg = loadedKg(plates);
  const status = loadStatus(currentKg, targetKg);
  const moves = plates.length;

  function finishWin(nextMoves: number) {
    const grade = barbellDailyGrade(nextMoves, challenge.parMoves);
    const progress = recordBarbellDailyWin(challenge.dayKey, nextMoves);
    haptic("success");
    onWin({ moves: nextMoves, grade, streak: progress.streak });
  }

  function setNext(next: number[]) {
    const prev = loadStatus(loadedKg(plates), targetKg);
    const nextStatus = loadStatus(loadedKg(next), targetKg);
    if (nextStatus === "hit" && prev !== "hit") {
      if (movesHitTarget(next, targetKg)) {
        setPlates(next);
        finishWin(next.length);
        return;
      }
    }
    if (nextStatus === "over" && prev !== "over") {
      haptic("error");
    } else {
      haptic("tap");
    }
    setPlates(next);
  }

  const line =
    status === "over"
      ? REST_LOAD_OVER_LINE
      : status === "hit"
        ? barbellDailyGradeLine(barbellDailyGrade(moves, challenge.parMoves))
        : `${plateLabel(currentKg)} / ${plateLabel(targetKg)} кг · ${moves} блинов`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        status === "hit" && "animate-recap-glow",
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <LoadBar plates={plates} over={status === "over"} />
        <p
          className={cn(
            "text-center text-sm font-medium",
            status === "over"
              ? "text-destructive"
              : status === "hit"
                ? "text-foreground"
                : "text-muted-foreground",
          )}
        >
          {line}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Пар — {challenge.parMoves}{" "}
          {challenge.parMoves === 1 ? "блин" : "блина"}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDE_PLATES.map((plate) => (
          <Button
            key={plate}
            type="button"
            variant="outline"
            className="h-11 px-1.5 text-base"
            disabled={status === "hit"}
            onClick={() => setNext(addSidePlate(plates, plate))}
          >
            {plateLabel(plate)}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-1.5 text-base"
          disabled={status === "hit" || plates.length === 0}
          onClick={() => setNext(undoSidePlate(plates))}
        >
          Снять
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-10 text-base"
        disabled={status === "hit" || plates.length === 0}
        onClick={() => {
          haptic("tick");
          setPlates([]);
        }}
      >
        Сбросить гриф
      </Button>
    </div>
  );
}
