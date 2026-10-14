"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import { haptic } from "@/lib/telegram/haptic";

interface PortionChip {
  grams: number;
  label: string;
}

export function PortionHistoryChips({
  foodId,
  onPick,
}: {
  foodId: string;
  onPick: (grams: number) => void;
}) {
  const [chips, setChips] = useState<PortionChip[]>([]);

  useEffect(() => {
    let cancelled = false;
    void cachedGet(`/api/foods/${foodId}/portions`, (data) => {
      if (!cancelled) {
        setChips(readChips(data));
      }
      return true;
    }).catch(() => {
      if (!cancelled) {
        setChips([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [foodId]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {chips.map((chip) => (
        <Button
          key={chip.label}
          type="button"
          variant="secondary"
          className="h-12 text-base"
          onClick={() => {
            haptic("tick");
            onPick(chip.grams);
          }}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}

function readChips(data: unknown): PortionChip[] {
  if (typeof data !== "object" || data == null || !("chips" in data)) {
    return [];
  }
  if (!Array.isArray(data.chips)) {
    return [];
  }
  return data.chips.flatMap((chip) => {
    if (typeof chip !== "object" || chip == null) {
      return [];
    }
    if (
      !("grams" in chip) ||
      typeof chip.grams !== "number" ||
      !(chip.grams > 0)
    ) {
      return [];
    }
    if (
      !("label" in chip) ||
      typeof chip.label !== "string" ||
      chip.label === ""
    ) {
      return [];
    }
    return [{ grams: chip.grams, label: chip.label }];
  });
}
