export const BODY_WEIGHT_MIN = 20;
export const BODY_WEIGHT_MAX = 400;

export function roundBodyWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parseBodyWeight(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const rounded = roundBodyWeight(value);
  if (rounded < BODY_WEIGHT_MIN || rounded > BODY_WEIGHT_MAX) {
    return null;
  }

  return rounded;
}

export function formatBodyWeight(value: number): string {
  const rounded = roundBodyWeight(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatProteinPerKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text.replace(".", ",")} г/кг`;
}

export function formatRelative(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0$/, "");
  return `${text.replace(".", ",")}×`;
}

export function formatSignedBodyWeight(value: number): string {
  const abs = formatBodyWeight(Math.abs(value));
  if (value > 0) {
    return `+${abs}`;
  }
  if (value < 0) {
    return `−${abs}`;
  }
  return formatBodyWeight(0);
}
