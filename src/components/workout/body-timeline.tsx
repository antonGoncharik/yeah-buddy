"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cachedGet } from "@/lib/api-cache";
import {
  type BodyPhoto,
  deleteBodyPhoto,
  listBodyPhotos,
  saveBodyPhoto,
} from "@/lib/body/photo-store";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";

export function BodyTimeline() {
  const [photos, setPhotos] = useState<Array<BodyPhoto & { url: string }>>([]);
  const [thenDate, setThenDate] = useState<string | null>(null);
  const [nowDate, setNowDate] = useState<string | null>(null);
  const [wipe, setWipe] = useState(50);
  const [caption, setCaption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listBodyPhotos()
      .then((rows) => {
        if (cancelled) {
          return;
        }
        const next = rows.map((row) => ({
          ...row,
          url: URL.createObjectURL(row.blob),
        }));
        setPhotos(next);
        setThenDate(next[0]?.date ?? null);
        setNowDate(next.at(-1)?.date ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Снимки не открылись.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.url);
      }
    };
  }, [photos]);

  useEffect(() => {
    if (!thenDate || !nowDate || thenDate === nowDate) {
      setCaption(null);
      return;
    }
    let cancelled = false;
    void cachedGet(
      `/api/body/compare?then=${thenDate}&now=${nowDate}`,
      (data) => {
        if (!cancelled) {
          setCaption(readCaption(data));
        }
        return true;
      },
    ).catch(() => {
      if (!cancelled) {
        setCaption(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nowDate, thenDate]);

  async function onFile(file: File | undefined) {
    if (!file?.type.startsWith("image/")) {
      return;
    }
    const date = calendarToday();
    try {
      await saveBodyPhoto(date, file);
      const url = URL.createObjectURL(file);
      setPhotos((current) => {
        const without = current.filter((photo) => photo.date !== date);
        for (const photo of current) {
          if (photo.date === date) {
            URL.revokeObjectURL(photo.url);
          }
        }
        return [...without, { date, blob: file, url }].sort((left, right) =>
          left.date.localeCompare(right.date),
        );
      });
      setNowDate(date);
      setThenDate((current) => current ?? date);
      haptic("commit");
    } catch {
      haptic("error");
      setError("Снимок не сохранился на этом телефоне.");
    }
  }

  const thenPhoto = photos.find((photo) => photo.date === thenDate) ?? null;
  const nowPhoto = photos.find((photo) => photo.date === nowDate) ?? null;
  const canCompare =
    thenPhoto != null && nowPhoto != null && thenPhoto.date !== nowPhoto.date;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Тело</h3>
        <label className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
          Снимок
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-sm leading-snug text-muted-foreground">
        Фото остаётся на этом телефоне. Под ним — вес, талия, калории и рабочие
        веса вокруг этих дат.
      </p>
      {photos.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <Button
              key={photo.date}
              type="button"
              variant={
                photo.date === thenDate || photo.date === nowDate
                  ? "secondary"
                  : "outline"
              }
              className="min-h-11"
              onClick={() => {
                haptic("tick");
                if (!thenDate || photo.date < thenDate) {
                  setThenDate(photo.date);
                  return;
                }
                setNowDate(photo.date);
              }}
            >
              {formatIsoDate(photo.date, "d MMM")}
            </Button>
          ))}
        </div>
      ) : null}
      {canCompare && thenPhoto && nowPhoto ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
            {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
            <img
              src={thenPhoto.url}
              alt={`Тогда, ${formatIsoDate(thenPhoto.date, "d MMM")}`}
              className="absolute inset-0 size-full object-cover"
            />
            {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
            <img
              src={nowPhoto.url}
              alt={`Сейчас, ${formatIsoDate(nowPhoto.date, "d MMM")}`}
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
            onChange={(event) => setWipe(Number(event.target.value))}
          />
        </div>
      ) : nowPhoto ? (
        <div>
          {/* biome-ignore lint/performance/noImgElement: local body photo, not a remote asset */}
          <img
            src={nowPhoto.url}
            alt={formatIsoDate(nowPhoto.date, "d MMM")}
            className="aspect-[3/4] w-full rounded-2xl object-cover"
          />
        </div>
      ) : (
        <p className="text-base text-muted-foreground">
          Два снимка в разные дни — и можно провести границу между тогда и
          сейчас.
        </p>
      )}
      {caption ? <p className="text-base leading-snug">{caption}</p> : null}
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {nowPhoto ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 self-start"
          onClick={() => {
            void deleteBodyPhoto(nowPhoto.date).then(() => {
              URL.revokeObjectURL(nowPhoto.url);
              setPhotos((current) =>
                current.filter((photo) => photo.date !== nowPhoto.date),
              );
              setNowDate(null);
            });
          }}
        >
          Удалить этот снимок
        </Button>
      ) : null}
    </section>
  );
}

function readCaption(data: unknown): string | null {
  if (typeof data !== "object" || data == null || !("caption" in data)) {
    return null;
  }
  return typeof data.caption === "string" && data.caption !== ""
    ? data.caption
    : null;
}
