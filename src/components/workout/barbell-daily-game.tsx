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
  barbellDailyPlayLine,
  canTakePlate,
  formatSidePlateStack,
  movesHitTarget,
  plateCountWord,
  rackCount,
} from "@/lib/workout/barbell-daily";
import { recordBarbellDailyWin } from "@/lib/workout/barbell-daily-storage";
import {
  addSidePlate,
  loadedKg,
  loadStatus,
  plateLabel,
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
  const [missed, setMissed] = useState(false);
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
      setMissed(true);
      haptic("error");
    } else {
      haptic("tap");
    }
    setPlates(next);
  }

  const line =
    status === "hit"
      ? barbellDailyGradeLine(barbellDailyGrade(moves, challenge.parMoves))
      : barbellDailyPlayLine(currentKg, targetKg, missed);

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
          Пар — {challenge.parMoves} {plateCountWord(challenge.parMoves)}
          {status === "hit" ? (
            <> · на сторону {formatSidePlateStack(challenge.parPlates)}</>
          ) : null}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDE_PLATES.map((plate) => {
          const left = Math.max(
            0,
            rackCount(challenge.rack, plate) -
              plates.filter((used) => used === plate).length,
          );
          return (
            <Button
              key={plate}
              type="button"
              variant="outline"
              className="h-14 px-1.5 text-base"
              disabled={
                status === "hit" || !canTakePlate(challenge.rack, plates, plate)
              }
              onClick={() => {
                if (!canTakePlate(challenge.rack, plates, plate)) {
                  return;
                }
                setNext(addSidePlate(plates, plate));
              }}
            >
              <span className="flex flex-col items-center leading-none">
                <span>{plateLabel(plate)}</span>
                <span className="mt-1 text-xs font-medium tabular-nums text-foreground/75">
                  ×{left}
                </span>
              </span>
            </Button>
          );
        })}
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
