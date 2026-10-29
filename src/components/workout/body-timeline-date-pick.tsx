"use client";

import { Button } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";

export function BodyTimelineDatePick({
  label,
  photos,
  selected,
  onPick,
}: {
  label: string;
  photos: Array<{ date: string }>;
  selected: string | null;
  onPick: (date: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {photos.map((photo) => (
        <Button
          key={`${label}-${photo.date}`}
          type="button"
          variant={photo.date === selected ? "secondary" : "outline"}
          className="min-h-11"
          onClick={() => {
            haptic("tick");
            onPick(photo.date);
          }}
        >
          {formatIsoDate(photo.date, "d MMM")}
        </Button>
      ))}
    </div>
  );
}
