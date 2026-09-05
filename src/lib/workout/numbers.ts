export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function formatWeight(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatSeconds(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function percentChange(start: number, end: number): number | null {
  if (start <= 0) {
    return null;
  }

  return ((end - start) / start) * 100;
}

export function formatSignedPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const abs = Number.isInteger(rounded)
    ? String(Math.abs(rounded))
    : Math.abs(rounded).toFixed(1);
  if (rounded > 0) {
    return `+${abs}%`;
  }
  if (rounded < 0) {
    return `−${abs}%`;
  }
  return "0%";
}

export function formatSignedWeight(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const abs = formatWeight(Math.abs(rounded));
  if (rounded > 0) {
    return `+${abs}`;
  }
  if (rounded < 0) {
    return `−${abs}`;
  }
  return formatWeight(0);
}
