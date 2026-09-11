import type { DayType } from "@/lib/types";

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  rest: "Отдых",
  training: "Тренировка",
};

export const DAY_TEMPLATE_TITLES: Record<DayType, string> = {
  rest: "День отдыха",
  training: "День тренировки",
};
