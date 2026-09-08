export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function round0(value: number): number {
  return Math.round(value);
}

export function formatG(value: number): string {
  const rounded = round1(value);
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return text.replace(".", ",");
}

export function formatKcalPlain(value: number): string {
  return String(round0(value));
}

export function formatPct(value: number): string {
  const rounded = round1(value);
  const abs = Number.isInteger(rounded)
    ? String(Math.abs(rounded))
    : Math.abs(rounded).toFixed(1).replace(".", ",");
  if (rounded > 0) {
    return `+${abs}%`;
  }
  if (rounded < 0) {
    return `−${abs}%`;
  }
  return "0%";
}
