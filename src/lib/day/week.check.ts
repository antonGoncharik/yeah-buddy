import {
  buildWeekSlots,
  dayHasFood,
  parseWeekPayload,
  type WeekSessionInput,
  type WeekSlot,
  weekDates,
  weekHasEntries,
  weekSlotHref,
  weekWindow,
} from "@/lib/day/week";
import type { DayHistoryRow } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const today = "2026-09-12";

function day(input: {
  date: string;
  training?: boolean;
  protein?: number;
  targetProtein?: number;
  fat?: number;
  carbs?: number;
  kcal?: number;
  weight?: number | null;
}): DayHistoryRow {
  return {
    date: input.date,
    is_training_day: input.training ?? false,
    target_protein: input.targetProtein ?? 120,
    target_fat: 70,
    target_carbs: 200,
    target_kcal: 1910,
    body_weight: input.weight ?? null,
    fact_protein: input.protein ?? 0,
    fact_fat: input.fat ?? 0,
    fact_carbs: input.carbs ?? 0,
    fact_kcal: input.kcal ?? 0,
  };
}

function session(input: {
  id: string;
  date: string;
  status?: WeekSessionInput["status"];
  name?: string | null;
}): WeekSessionInput {
  return {
    id: input.id,
    session_date: input.date,
    status: input.status ?? "completed",
    template_name: input.name === undefined ? "Верх" : input.name,
    workout_type: "dynamic",
  };
}

function slotSummary(slots: WeekSlot[]) {
  return slots.map((slot) => ({
    date: slot.date,
    day: slot.day?.date ?? null,
    training: slot.day?.is_training_day ?? null,
    food: dayHasFood(slot.day),
    weight: slot.day?.body_weight ?? null,
    gym: slot.session?.id ?? null,
    gymStatus: slot.session?.status ?? null,
    gymName: slot.session?.template_name ?? null,
  }));
}

assertEqual(weekWindow(today), { start: "2026-09-06", end: today }, "window");
assertEqual(
  weekDates(today),
  [
    "2026-09-12",
    "2026-09-11",
    "2026-09-10",
    "2026-09-09",
    "2026-09-08",
    "2026-09-07",
    "2026-09-06",
  ],
  "seven days today first",
);

const empty = buildWeekSlots({ today, days: [], sessions: [] });
assertEqual(empty.length, 7, "empty window still seven");
assertEqual(
  empty.map((slot) => slot.date),
  weekDates(today),
  "empty dates",
);
assertEqual(weekHasEntries(empty), false, "empty window has no entries");
assertEqual(
  empty.every((slot) => slot.day == null && slot.session == null),
  true,
  "empty slots",
);

const mixed = buildWeekSlots({
  today,
  days: [
    day({
      date: today,
      training: true,
      protein: 118,
      fat: 60,
      carbs: 200,
      kcal: 1800,
      weight: 81.5,
    }),
    day({ date: "2026-09-11", protein: 110, fat: 50, carbs: 180, kcal: 1600 }),
    day({ date: "2026-09-09" }),
    day({ date: "2026-09-01", protein: 90, fat: 40, carbs: 150, kcal: 1400 }),
  ],
  sessions: [
    session({ id: "today-gym", date: today, status: "planned", name: "Верх" }),
    session({ id: "rest-skip", date: "2026-09-11", status: "skipped" }),
    session({ id: "gym-only", date: "2026-09-10", name: "Низ" }),
    session({
      id: "old-planned",
      date: "2026-09-09",
      status: "planned",
      name: "Старая",
    }),
    session({ id: "dup-new", date: "2026-09-08", name: "Первая" }),
    session({ id: "dup-old", date: "2026-09-08", name: "Вторая" }),
    session({ id: "future", date: "2026-09-13", name: "Завтра" }),
  ],
});

assertEqual(mixed.length, 7, "mixed still seven");
assertEqual(weekHasEntries(mixed), true, "mixed has entries");
assertEqual(
  slotSummary(mixed),
  [
    {
      date: today,
      day: today,
      training: true,
      food: true,
      weight: 81.5,
      gym: "today-gym",
      gymStatus: "planned",
      gymName: "Верх",
    },
    {
      date: "2026-09-11",
      day: "2026-09-11",
      training: false,
      food: true,
      weight: null,
      gym: null,
      gymStatus: null,
      gymName: null,
    },
    {
      date: "2026-09-10",
      day: null,
      training: null,
      food: false,
      weight: null,
      gym: "gym-only",
      gymStatus: "completed",
      gymName: "Низ",
    },
    {
      date: "2026-09-09",
      day: "2026-09-09",
      training: false,
      food: false,
      weight: null,
      gym: null,
      gymStatus: null,
      gymName: null,
    },
    {
      date: "2026-09-08",
      day: null,
      training: null,
      food: false,
      weight: null,
      gym: "dup-new",
      gymStatus: "completed",
      gymName: "Первая",
    },
    {
      date: "2026-09-07",
      day: null,
      training: null,
      food: false,
      weight: null,
      gym: null,
      gymStatus: null,
      gymName: null,
    },
    {
      date: "2026-09-06",
      day: null,
      training: null,
      food: false,
      weight: null,
      gym: null,
      gymStatus: null,
      gymName: null,
    },
  ],
  "holes gym-only day-only empty middle",
);

const completedWins = buildWeekSlots({
  today,
  days: [],
  sessions: [
    session({ id: "planned", date: today, status: "planned", name: "План" }),
    session({ id: "done", date: today, status: "completed", name: "Факт" }),
  ],
});
assertEqual(completedWins[0]?.session?.id, "done", "completed wins same date");

function hrefOn(date: string, fromSettings = false): string | null {
  const slot = mixed.find((item) => item.date === date);
  if (!slot) {
    throw new Error(`missing slot ${date}`);
  }
  return weekSlotHref(slot, today, fromSettings);
}

assertEqual(hrefOn(today), "/today", "today food href");
assertEqual(
  hrefOn("2026-09-11"),
  "/today?date=2026-09-11",
  "yesterday food href",
);
assertEqual(
  hrefOn("2026-09-10"),
  "/workouts/sessions/gym-only",
  "gym without day href",
);
assertEqual(
  hrefOn("2026-09-09"),
  "/today?date=2026-09-09&view=history",
  "old food day view",
);
assertEqual(
  hrefOn("2026-09-09", true),
  "/today?date=2026-09-09&view=history&from=settings",
  "old food from settings",
);
assertEqual(hrefOn("2026-09-07"), null, "empty hole is not a link");

const parsed = parseWeekPayload({
  today,
  items: mixed,
});
assertEqual(parsed?.items.length, 7, "parse keeps seven");
assertEqual(parseWeekPayload({ today }), null, "parse needs items");
assertEqual(parseWeekPayload({ items: mixed }), null, "parse needs today");

console.log("day week ok");
