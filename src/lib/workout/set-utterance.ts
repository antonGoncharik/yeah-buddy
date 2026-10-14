export interface ParsedSetUtterance {
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  rir: number | null;
}

function fold(value: string): string {
  return value.toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

function numberAt(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** «82 с половиной на 6, запас 1» → weight, reps, reserve. */
export function parseSetUtterance(raw: string): ParsedSetUtterance | null {
  const text = fold(raw);
  if (text === "") {
    return null;
  }

  const secondsMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:секунд|сек\b)/);
  const seconds = secondsMatch ? numberAt(secondsMatch[1] ?? "") : null;
  const rirMatch = text.match(/(?:запас|рир|rir)\s*(\d+)/);
  const rir = rirMatch ? numberAt(rirMatch[1] ?? "") : null;

  const half = text.match(/(\d+)\s*(?:с половиной|и половиной)/);
  let weight: number | null = half ? Number(half[1]) + 0.5 : null;
  const repsMatch = text.match(/(?:на|×|x|х)\s*(\d+(?:[.,]\d+)?)/);
  let reps = repsMatch ? numberAt(repsMatch[1] ?? "") : null;
  if (weight == null) {
    const leading = text.match(/(\d+(?:[.,]\d+)?)/);
    const leadingValue = leading ? numberAt(leading[1] ?? "") : null;
    const secondsValue = secondsMatch ? numberAt(secondsMatch[1] ?? "") : null;
    const rirValue = rirMatch ? numberAt(rirMatch[1] ?? "") : null;
    if (
      leadingValue != null &&
      leadingValue !== secondsValue &&
      leadingValue !== rirValue
    ) {
      weight = leadingValue;
    }
  }

  const repsWord = text.match(/(\d+(?:[.,]\d+)?)\s*повтор/);
  if (reps == null && repsWord) {
    const spoken = numberAt(repsWord[1] ?? "");
    if (spoken != null) {
      reps = spoken;
      if (weight === spoken) {
        weight = null;
      }
    }
  }

  if (
    seconds != null &&
    (seconds <= 0 || seconds > 600 || (reps != null && seconds === reps))
  ) {
    return clean({ weight, reps: null, seconds: null, rir });
  }
  if (weight != null && (weight <= 0 || weight > 500)) {
    weight = null;
  }
  if (reps != null && (reps <= 0 || reps > 100 || !Number.isInteger(reps))) {
    reps = null;
  }
  const reserve =
    rir != null && rir >= 0 && rir <= 10 && Number.isInteger(rir) ? rir : null;
  const hold =
    seconds != null && seconds > 0 && seconds <= 600 ? seconds : null;

  return clean({
    weight,
    reps: hold != null ? null : reps,
    seconds: hold,
    rir: reserve,
  });
}

function clean(value: ParsedSetUtterance): ParsedSetUtterance | null {
  if (
    value.weight == null &&
    value.reps == null &&
    value.seconds == null &&
    value.rir == null
  ) {
    return null;
  }
  return value;
}
