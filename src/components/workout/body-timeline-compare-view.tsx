"use client";

import { Button } from "@/components/ui/button";
import type { BodyPhotoWithUrl } from "@/components/workout/use-body-timeline";
import { shareBodyCompareCard } from "@/lib/body/body-compare-share";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";

export function BodyTimelineCompareView({
  thenPhoto,
  nowPhoto,
  wipe,
  onWipe,
  caption,
  sharing,
  onSharing,
  onShareError,
}: {
  thenPhoto: BodyPhotoWithUrl;
  nowPhoto: BodyPhotoWithUrl;
  wipe: number;
  onWipe: (value: number) => void;
  caption: string | null;
  sharing: boolean;
  onSharing: (value: boolean) => void;
  onShareError: (message: string) => void;
}) {
  const thenLabel = formatIsoDate(thenPhoto.date, "d MMM");
  const nowLabel = formatIsoDate(nowPhoto.date, "d MMM");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
        {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
        <img
          src={thenPhoto.url}
          alt={`Тогда, ${thenLabel}`}
          className="absolute inset-0 size-full object-cover"
        />
        {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
        <img
          src={nowPhoto.url}
          alt={`Сейчас, ${nowLabel}`}
          className="absolute inset-0 size-full object-cover"
          style={{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }}
        />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Тогда</span>
        <span>Сейчас</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={wipe}
        aria-label="Тогда и сейчас"
        className="h-11 w-full"
        onChange={(event) => onWipe(Number(event.target.value))}
      />
      {caption ? <p className="text-base leading-snug">{caption}</p> : null}
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start"
        disabled={sharing}
        onClick={() => {
          onSharing(true);
          void shareBodyCompareCard(
            thenPhoto.url,
            nowPhoto.url,
            thenLabel,
            nowLabel,
            caption ?? `${thenLabel} и ${nowLabel}`,
          )
            .catch(() => {
              haptic("error");
              onShareError("Карточка не собралась.");
            })
            .finally(() => onSharing(false));
        }}
      >
        {sharing ? "Собираю…" : "Карточка для сторис"}
      </Button>
    </div>
  );
}
