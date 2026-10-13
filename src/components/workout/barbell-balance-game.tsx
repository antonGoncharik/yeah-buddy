"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BalanceBar } from "@/components/workout/balance-bar";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  type BalanceSide,
  balanceGrade,
  balanceGradeLine,
  balanceHitsTarget,
  balancePlayLine,
  balanceWouldDump,
} from "@/lib/workout/barbell-balance";
import { plateLabel } from "@/lib/workout/rest-load";

interface HandPlate {
  id: string;
  plate: number;
}

interface BalanceMove {
  id: string;
  plate: number;
  side: BalanceSide;
}

export function BarbellBalanceGame({
  targetKg,
  pile,
}: {
  targetKg: number;
  pile: readonly number[];
}) {
  const [left, setLeft] = useState<number[]>([]);
  const [right, setRight] = useState<number[]>([]);
  const [hand, setHand] = useState<HandPlate[]>(() => toHand(pile));
  const [moves, setMoves] = useState<BalanceMove[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dumps, setDumps] = useState(0);
  const [tipped, setTipped] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    if (!tipped) {
      return;
    }
    const timer = window.setTimeout(() => {
      setLeft([]);
      setRight([]);
      setHand(toHand(pile));
      setMoves([]);
      setSelected(null);
      setTipped(false);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [pile, tipped]);

  const line = won
    ? balanceGradeLine(balanceGrade(dumps))
    : balancePlayLine(left, right, targetKg, tipped);

  function place(side: BalanceSide) {
    if (won || tipped || selected == null) {
      return;
    }
    const card = hand.find((item) => item.id === selected);
    if (!card) {
      return;
    }
    const nextLeft = side === "left" ? [...left, card.plate] : left;
    const nextRight = side === "right" ? [...right, card.plate] : right;
    const nextHand = hand.filter((item) => item.id !== card.id);
    const nextMoves = [...moves, { id: card.id, plate: card.plate, side }];
    setSelected(null);
    if (balanceWouldDump(nextLeft, nextRight)) {
      setLeft(nextLeft);
      setRight(nextRight);
      setHand(nextHand);
      setMoves(nextMoves);
      setDumps((count) => count + 1);
      setTipped(true);
      haptic("error");
      return;
    }
    setLeft(nextLeft);
    setRight(nextRight);
    setHand(nextHand);
    setMoves(nextMoves);
    if (balanceHitsTarget(nextLeft, nextRight, targetKg)) {
      setWon(true);
      haptic("success");
      return;
    }
    haptic("tap");
  }

  function undo() {
    const last = moves.at(-1);
    if (!last || won || tipped) {
      return;
    }
    setMoves((list) => list.slice(0, -1));
    setHand((cards) => [...cards, { id: last.id, plate: last.plate }]);
    if (last.side === "left") {
      setLeft((plates) => plates.slice(0, -1));
    } else {
      setRight((plates) => plates.slice(0, -1));
    }
    haptic("tick");
  }

  function replay() {
    setLeft([]);
    setRight([]);
    setHand(toHand(pile));
    setMoves([]);
    setSelected(null);
    setDumps(0);
    setTipped(false);
    setWon(false);
    haptic("tick");
  }

  return (
    <div className={cn("flex flex-col gap-3", won && "animate-recap-glow")}>
      <div className="flex flex-col items-center gap-1">
        <BalanceBar left={left} right={right} dumped={tipped} />
        <p
          className={cn(
            "text-center text-sm font-medium",
            tipped
              ? "text-destructive"
              : won
                ? "text-foreground"
                : "text-muted-foreground",
          )}
        >
          {line}
        </p>
        {dumps > 0 && !tipped ? (
          <p className="text-center text-xs text-muted-foreground">
            Съехали {dumps}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {hand.map((card) => (
          <Button
            key={card.id}
            type="button"
            variant={selected === card.id ? "secondary" : "outline"}
            className="h-11 px-1.5 text-base"
            disabled={won || tipped}
            aria-pressed={selected === card.id}
            onClick={() => {
              setSelected((current) => (current === card.id ? null : card.id));
              haptic("tick");
            }}
          >
            {plateLabel(card.plate)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="h-11 text-base"
          disabled={won || tipped || selected == null}
          onClick={() => place("left")}
        >
          Налево
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 text-base"
          disabled={won || tipped || selected == null}
          onClick={() => place("right")}
        >
          Направо
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-10 text-base"
        disabled={won || tipped || moves.length === 0}
        onClick={undo}
      >
        Снять
      </Button>
      {won ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 text-base"
          onClick={replay}
        >
          Ещё раз
        </Button>
      ) : null}
    </div>
  );
}

function toHand(pile: readonly number[]): HandPlate[] {
  return pile.map((plate, index) => ({
    id: `${index}:${plate}`,
    plate,
  }));
}
