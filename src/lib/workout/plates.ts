const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

/** Plates on one side of a 20 kg bar. Null when the load is not a bar load. */
export function platesPerSide(totalKg: number, barKg = 20): number[] | null {
  if (!(totalKg > barKg)) {
    return null;
  }
  let side = (totalKg - barKg) / 2;
  if (side <= 0 || Math.abs(side * 2 + barKg - totalKg) > 0.05) {
    return null;
  }
  const plates: number[] = [];
  for (const plate of PLATES_KG) {
    while (side + 0.01 >= plate) {
      plates.push(plate);
      side -= plate;
      if (plates.length > 8) {
        return null;
      }
    }
  }
  if (side > 0.2) {
    return null;
  }
  return plates;
}

export function platesLine(totalKg: number): string | null {
  const plates = platesPerSide(totalKg);
  if (!plates || plates.length === 0) {
    return null;
  }
  return `На сторону: ${plates.join(" + ")} кг`;
}

/** How the plates on one side changed from the previous bar set. */
export function plateDeltaLine(
  previousKg: number | null,
  nextKg: number,
): string | null {
  if (previousKg == null) {
    return null;
  }
  const before = platesPerSide(previousKg);
  const after = platesPerSide(nextKg);
  if (!before || !after) {
    return null;
  }
  const delta =
    after.reduce((sum, plate) => sum + plate, 0) -
    before.reduce((sum, plate) => sum + plate, 0);
  if (Math.abs(delta) < 0.05) {
    return null;
  }
  const sign = delta > 0 ? "+" : "−";
  return `(${sign}${Math.abs(delta)} кг на сторону)`;
}
