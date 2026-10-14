"use client";

import { useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { measureTrendLine } from "@/lib/day/measure-trend";
import { parseWeekPayload } from "@/lib/day/week";

export function MeasureTrendLines({
  weight,
  waist,
}: {
  weight: number | null;
  waist: number | null;
}) {
  const [lines, setLines] = useState<{
    weight: string | null;
    waist: string | null;
  }>({
    weight: null,
    waist: null,
  });

  useEffect(() => {
    let cancelled = false;
    void cachedGet("/api/days/week", (data) => {
      const week = parseWeekPayload(data);
      if (!week || cancelled) {
        return week != null;
      }
      const today = week.today || calendarToday();
      const weights = week.items.flatMap((slot) =>
        slot.day?.body_weight != null && slot.day.body_weight > 0
          ? [{ date: slot.date, value: slot.day.body_weight }]
          : [],
      );
      const waists = week.items.flatMap((slot) =>
        slot.day?.waist_cm != null && slot.day.waist_cm > 0
          ? [{ date: slot.date, value: slot.day.waist_cm }]
          : [],
      );
      setLines({
        weight: measureTrendLine({
          today,
          current: weight,
          points: weights,
          unit: "кг",
        }),
        waist: measureTrendLine({
          today,
          current: waist,
          points: waists,
          unit: "см",
        }),
      });
      return true;
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [waist, weight]);

  if (!lines.weight && !lines.waist) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
      {lines.weight ? <p>{lines.weight}</p> : null}
      {lines.waist ? <p>{lines.waist}</p> : null}
    </div>
  );
}
