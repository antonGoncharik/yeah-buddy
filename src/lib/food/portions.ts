import { shiftIsoDate } from "@/lib/day/dates";
import { formatGrams } from "@/lib/nutrition";

export interface PortionLog {
  date: string;
  grams: number;
}

export interface PortionChip {
  grams: number;
  label: string;
}

function sameGrams(left: number, right: number): boolean {
  return Math.round(left * 10) === Math.round(right * 10);
}

function gramsLabel(prefix: string, grams: number): string {
  return `${prefix} · ${formatGrams(grams)} г`;
}

/** Two or three chips from this food's own log: usual, last time, a named piece. */
export function portionChips(input: {
  logs: readonly PortionLog[];
  today: string;
  pieceGrams?: number | null;
  pieceLabel?: string | null;
}): PortionChip[] {
  const logs = input.logs.filter(
    (log) => log.grams > 0 && log.date <= input.today,
  );
  const chips: PortionChip[] = [];
  const counts = new Map<
    number,
    { grams: number; count: number; date: string }
  >();
  for (const log of logs) {
    const key = Math.round(log.grams * 10);
    const current = counts.get(key);
    if (!current) {
      counts.set(key, { grams: log.grams, count: 1, date: log.date });
      continue;
    }
    current.count += 1;
    if (log.date > current.date) {
      current.date = log.date;
      current.grams = log.grams;
    }
  }

  const usual = [...counts.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return right.date.localeCompare(left.date);
  })[0];
  if (usual && usual.count >= 2) {
    chips.push({
      grams: usual.grams,
      label: gramsLabel("Как обычно", usual.grams),
    });
  }

  const latest = [...logs].sort((left, right) =>
    right.date.localeCompare(left.date),
  )[0];
  if (latest && !chips.some((chip) => sameGrams(chip.grams, latest.grams))) {
    const yesterday = shiftIsoDate(input.today, -1);
    const when =
      latest.date === input.today
        ? "Сегодня"
        : latest.date === yesterday
          ? "Вчера"
          : "Прошлый раз";
    chips.push({
      grams: latest.grams,
      label: gramsLabel(when, latest.grams),
    });
  }

  const piece = namedPiece(input.pieceLabel);
  if (
    input.pieceGrams != null &&
    input.pieceGrams > 0 &&
    piece != null &&
    chips.length < 3 &&
    !chips.some((chip) => sameGrams(chip.grams, input.pieceGrams ?? 0))
  ) {
    chips.push({
      grams: input.pieceGrams,
      label: gramsLabel(piece, input.pieceGrams),
    });
  }

  return chips.slice(0, 3);
}

/** A piece chip is a name («1 шт», «ломтик»), not a second copy of the grams. */
function namedPiece(label: string | null | undefined): string | null {
  const piece = label?.trim() ?? "";
  if (piece === "" || /^\d+(?:[.,]\d+)?\s*(?:г|гр|мл)\.?$/i.test(piece)) {
    return null;
  }
  return piece;
}
