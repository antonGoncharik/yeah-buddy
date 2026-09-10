import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatIsoDate(isoDate: string, pattern: string): string {
  try {
    return format(parseISO(isoDate), pattern, { locale: ru });
  } catch {
    return isoDate;
  }
}

export function formatYearMonth(yearMonth: string): string {
  try {
    return format(parseISO(`${yearMonth}-01`), "LLLL yyyy", { locale: ru });
  } catch {
    return yearMonth;
  }
}

export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string,
): Array<{ key: string; label: string; items: T[] }> {
  const groups: Array<{ key: string; label: string; items: T[] }> = [];

  for (const item of items) {
    const key = getDate(item).slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.items.push(item);
      continue;
    }
    groups.push({
      key,
      label: formatYearMonth(key),
      items: [item],
    });
  }

  return groups;
}
