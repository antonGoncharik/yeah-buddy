export class OrderMismatchError extends Error {
  constructor() {
    super("Список изменился. Обнови страницу.");
  }
}

export function sameIds(expected: string[], next: string[]): boolean {
  if (expected.length !== next.length) {
    return false;
  }
  if (new Set(next).size !== next.length) {
    return false;
  }
  const known = new Set(expected);
  return next.every((id) => known.has(id));
}

export function assertSameIds(expected: string[], next: string[]): void {
  if (!sameIds(expected, next)) {
    throw new OrderMismatchError();
  }
}

export function orderRanks(
  ids: string[],
  base = 0,
): Array<{
  id: string;
  sort_order: number;
}> {
  return ids.map((id, index) => ({
    id,
    sort_order: base + (index + 1) * 10,
  }));
}
