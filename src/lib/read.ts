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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

export function readKeyedRecord(
  data: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(data)) {
    return null;
  }

  return readRecord(data[key]);
}

export function mapRecordList<T>(
  value: unknown,
  mapItem: (row: Record<string, unknown>) => T | null,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: T[] = [];
  for (const item of value) {
    const row = readRecord(item);
    if (!row) {
      continue;
    }
    const parsed = mapItem(row);
    if (parsed) {
      items.push(parsed);
    }
  }
  return items;
}
