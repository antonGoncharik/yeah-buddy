"use client";

import { Button } from "@/components/ui/button";
import { SORE_SPOTS, type SoreMark } from "@/lib/workout/sore";

export function SessionSoreSpotPicker({
  active,
  onToggle,
}: {
  active: SoreMark[];
  onToggle: (id: (typeof SORE_SPOTS)[number]["id"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORE_SPOTS.map((spot) => {
        const on = active.some((mark) => mark.id === spot.id);
        return (
          <Button
            key={spot.id}
            type="button"
            variant={on ? "secondary" : "outline"}
            className="min-h-11"
            onClick={() => onToggle(spot.id)}
          >
            {spot.label}
          </Button>
        );
      })}
    </div>
  );
}
