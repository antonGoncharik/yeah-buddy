"use client";

import { useEffect, useRef, useState } from "react";

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
  const [shotDate, setShotDate] = useState(calendarToday);
  const [sharing, setSharing] = useState(false);
  const photosRef = useRef(photos);
  photosRef.current = photos;

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
      for (const photo of photosRef.current) {
        URL.revokeObjectURL(photo.url);
      }
    };
  }, []);

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
    const date = shotDate || calendarToday();
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
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="date"
            value={shotDate}
            aria-label="Дата снимка"
            className="h-11 rounded-lg bg-muted px-2 text-base"
            onChange={(event) => setShotDate(event.target.value)}
          />
          Снимок
          <input
            type="file"
            accept="image/*"
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
        <div className="flex flex-col gap-2">
          <DatePick
            label="Тогда"
            photos={photos}
            selected={thenDate}
            onPick={setThenDate}
          />
          <DatePick
            label="Сейчас"
            photos={photos}
            selected={nowDate}
            onPick={setNowDate}
          />
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
      {canCompare && thenPhoto && nowPhoto ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-start"
          disabled={sharing}
          onClick={() => {
            setSharing(true);
            void shareCompareCard(
              thenPhoto.url,
              nowPhoto.url,
              caption ??
                `${formatIsoDate(thenPhoto.date, "d MMM")} и ${formatIsoDate(nowPhoto.date, "d MMM")}`,
            )
              .catch(() => {
                haptic("error");
                setError("Карточка не собралась.");
              })
              .finally(() => setSharing(false));
          }}
        >
          {sharing ? "Собираю…" : "Карточка для сторис"}
        </Button>
      ) : null}
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

function DatePick({
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

async function shareCompareCard(
  thenUrl: string,
  nowUrl: string,
  caption: string,
) {
  const [before, after] = await Promise.all([
    loadImage(thenUrl),
    loadImage(nowUrl),
  ]);
  const width = 1080;
  const photoWidth = width / 2;
  const photoHeight = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = photoHeight + 220;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas");
  }
  context.fillStyle = "#111111";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawCover(context, before, 0, 0, photoWidth, photoHeight);
  drawCover(context, after, photoWidth, 0, photoWidth, photoHeight);
  context.fillStyle = "#f5f5f5";
  context.font = "36px sans-serif";
  wrapText(context, caption, 48, photoHeight + 64, width - 96, 46);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) {
    throw new Error("blob");
  }
  const file = new File([blob], "yeah-buddy-body.jpg", { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Тогда и сейчас" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  context.drawImage(
    image,
    x + (width - drawnWidth) / 2,
    y + (height - drawnHeight) / 2,
    drawnWidth,
    drawnHeight,
  );
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line === "" ? word : `${line} ${word}`;
    if (context.measureText(next).width > maxWidth && line !== "") {
      context.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
      continue;
    }
    line = next;
  }
  if (line !== "") {
    context.fillText(line, x, cursor);
  }
}

function readCaption(data: unknown): string | null {
  if (typeof data !== "object" || data == null || !("caption" in data)) {
    return null;
  }
  return typeof data.caption === "string" && data.caption !== ""
    ? data.caption
    : null;
}
