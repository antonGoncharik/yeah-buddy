"use client";

import { useEffect, useRef, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { readBodyCompareCaption } from "@/lib/body/body-compare-caption";
import {
  type BodyPhoto,
  deleteBodyPhoto,
  listBodyPhotos,
  saveBodyPhoto,
} from "@/lib/body/photo-store";
import { calendarToday } from "@/lib/day/dates";
import { haptic } from "@/lib/telegram/haptic";

export type BodyPhotoWithUrl = BodyPhoto & { url: string };

export function useBodyTimeline() {
  const [photos, setPhotos] = useState<BodyPhotoWithUrl[]>([]);
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
          setCaption(readBodyCompareCaption(data));
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

  async function addPhoto(file: File | undefined) {
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

  async function removeNowPhoto(nowPhoto: BodyPhotoWithUrl) {
    await deleteBodyPhoto(nowPhoto.date);
    URL.revokeObjectURL(nowPhoto.url);
    const remaining = photos.filter((photo) => photo.date !== nowPhoto.date);
    setPhotos(remaining);
    setNowDate(remaining.at(-1)?.date ?? null);
    setThenDate((current) =>
      remaining.some((photo) => photo.date === current)
        ? current
        : (remaining[0]?.date ?? null),
    );
  }

  const thenPhoto = photos.find((photo) => photo.date === thenDate) ?? null;
  const nowPhoto = photos.find((photo) => photo.date === nowDate) ?? null;
  const canCompare =
    thenPhoto != null && nowPhoto != null && thenPhoto.date !== nowPhoto.date;

  return {
    photos,
    thenDate,
    setThenDate,
    nowDate,
    setNowDate,
    wipe,
    setWipe,
    caption,
    error,
    setError,
    shotDate,
    setShotDate,
    sharing,
    setSharing,
    addPhoto,
    removeNowPhoto,
    thenPhoto,
    nowPhoto,
    canCompare,
  };
}
