"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadBar } from "@/components/workout/load-bar";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";
import {
  addSidePlate,
  loadedKg,
  loadStatus,
  plateLabel,
  restLoadLine,
  SIDE_PLATES,
  undoSidePlate,
} from "@/lib/workout/rest-load";

export function RestLoadGame({ targetKg }: { targetKg: number }) {
  const [plates, setPlates] = useState<number[]>([]);
  const currentKg = loadedKg(plates);
  const status = loadStatus(currentKg, targetKg);
  const line = restLoadLine(currentKg, targetKg);

  function setNext(next: number[]) {
    const prev = loadStatus(loadedKg(plates), targetKg);
    const nextStatus = loadStatus(loadedKg(next), targetKg);
    if (nextStatus === "hit" && prev !== "hit") {
      haptic("success");
    } else if (nextStatus === "over" && prev !== "over") {
      haptic("error");
    } else {
      haptic("tap");
    }
    setPlates(next);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        status === "hit" && "animate-recap-glow",
      )}
    >
      <button
        type="button"
        className="flex flex-col items-center gap-1 pt-1"
        aria-label="Сбросить блины"
        onClick={() => {
          if (plates.length === 0) {
            return;
          }
          haptic("tick");
          setPlates([]);
        }}
      >
        <LoadBar plates={plates} over={status === "over"} />
        <p
          className={cn(
            "text-sm font-medium",
            status === "over"
              ? "text-destructive"
              : status === "hit"
                ? "text-foreground"
                : "text-muted-foreground",
          )}
        >
          {line}
        </p>
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {SIDE_PLATES.map((plate) => (
          <Button
            key={plate}
            type="button"
            variant="outline"
            className="h-11 px-1.5 text-base"
            onClick={() => setNext(addSidePlate(plates, plate))}
          >
            {plateLabel(plate)}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-1.5 text-base"
          disabled={plates.length === 0}
          onClick={() => setNext(undoSidePlate(plates))}
        >
          Снять
        </Button>
      </div>
    </div>
  );
}
