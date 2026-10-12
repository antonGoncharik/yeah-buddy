import {
  decodeMuscleWeekCard,
  muscleWeekCardSvg,
} from "@/lib/share/muscle-week-card";
import { decodeSundayCard, sundayCardSvg } from "@/lib/share/sunday-card";
import { decodeWeekCard } from "@/lib/share/week-card";
import {
  renderShareSvgJpeg,
  renderWeekCardJpeg,
} from "@/lib/share/week-card-image";

export async function renderShareCardJpeg(
  query: string,
  secret: string,
): Promise<Buffer | null> {
  const sunday = decodeSundayCard(query, secret);
  if (sunday) {
    return renderShareSvgJpeg(sundayCardSvg(sunday));
  }

  const muscleWeek = decodeMuscleWeekCard(query, secret);
  if (muscleWeek) {
    return renderShareSvgJpeg(muscleWeekCardSvg(muscleWeek));
  }

  const week = decodeWeekCard(query, secret);
  if (week) {
    return renderWeekCardJpeg(week);
  }

  return null;
}
