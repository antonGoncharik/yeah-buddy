import type { WeekSlot } from "@/lib/day/week";
import {
  buildWeekCard,
  decodeWeekCard,
  encodeWeekCard,
  macroInZone,
  WEEK_CARD_BUTTON,
  WEEK_CARD_HEADING,
  WEEK_CARD_QUERY_LIMIT,
  WEEK_PROGRESS_HINT,
  type WeekCardExercise,
  weekCardCaption,
  weekCardPhotoUrl,
  weekCardSvg,
} from "@/lib/share/week-card";
import type { DayHistoryRow } from "@/lib/types";

const SECRET = "week-card-secret-week-card-secret";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function day(
  date: string,
  input: {
    weight?: number | null;
    protein?: number;
    fat?: number;
    carbs?: number;
    targetProtein?: number;
    targetFat?: number;
    targetCarbs?: number;
  },
): DayHistoryRow {
  return {
    date,
    is_training_day: true,
    target_protein: input.targetProtein ?? 150,
    target_fat: input.targetFat ?? 70,
    target_carbs: input.targetCarbs ?? 240,
    target_kcal: 2100,
    body_weight: input.weight ?? null,
    waist_cm: null,
    caught_up: false,
    fact_protein: input.protein ?? 0,
    fact_fat: input.fat ?? 0,
    fact_carbs: input.carbs ?? 0,
    fact_kcal: (input.protein ?? 0) > 0 ? 2000 : 0,
  };
}

function slot(date: string, row: DayHistoryRow | null, gym = false): WeekSlot {
  return {
    date,
    day: row,
    session: gym
      ? {
          id: date,
          template_name: "Присед",
          status: "completed",
          workout_type: "dynamic",
        }
      : null,
  };
}

const exercises: WeekCardExercise[] = [
  {
    name: "Присед",
    category: "base",
    fromWork: true,
    points: [
      { date: "2026-09-21", weight: 140 },
      { date: "2026-09-25", weight: 142.5 },
    ],
  },
  {
    name: "Жим лёжа",
    category: "base",
    fromWork: true,
    points: [
      { date: "2026-09-22", weight: 100 },
      { date: "2026-09-26", weight: 100 },
    ],
  },
  {
    name: "Бицепс",
    category: "isolation",
    fromWork: false,
    points: [{ date: "2026-09-22", weight: 20 }],
  },
];

const card = buildWeekCard({
  today: "2026-09-27",
  slots: [
    slot(
      "2026-09-21",
      day("2026-09-21", { weight: 82.4, protein: 140, fat: 68, carbs: 230 }),
      true,
    ),
    slot(
      "2026-09-23",
      day("2026-09-23", { weight: 82, protein: 148, fat: 71, carbs: 236 }),
    ),
    slot(
      "2026-09-25",
      day("2026-09-25", { weight: 81.6, protein: 151, fat: 69, carbs: 244 }),
      true,
    ),
    slot("2026-09-20", day("2026-09-20", { weight: 90, protein: 200 }), true),
  ],
  exercises,
});

if (card == null) {
  throw new Error("week with numbers is a card");
}
assertEqual(card.from, "2026-09-21", "window starts six days back");
assertEqual(card.to, "2026-09-27", "window ends today");
assertEqual(card.weights, [82.4, 82, 81.6], "weigh-ins stay in order");
assertEqual(card.gymDays, 2, "old gym day stays outside");
assertEqual(
  card.lifts.map((lift) => lift.name),
  ["Присед", "Жим лёжа"],
  "moving base lift first, maxes stay out",
);
assertEqual(
  card.lifts[0],
  { name: "Присед", start: 140, end: 142.5 },
  "squat grew",
);
assert(
  card.macros.length > 0 && card.macros.every(macroInZone),
  "week is in zone",
);

const empty = buildWeekCard({
  today: "2026-09-27",
  slots: [slot("2026-09-27", null, true)],
  exercises: [],
});
assertEqual(empty, null, "gym without numbers is not a card");

const query = encodeWeekCard(card, SECRET);
assert(query.length <= WEEK_CARD_QUERY_LIMIT, "inline query fits");
assertEqual(decodeWeekCard(query, SECRET), card, "query roundtrip");
assertEqual(
  decodeWeekCard(query, "other-secret-other-secret-other"),
  null,
  "wrong secret",
);
assertEqual(
  decodeWeekCard(`${query.slice(0, -1)}a`, SECRET),
  null,
  "tampered query",
);
assertEqual(decodeWeekCard("joy protein", SECRET), null, "joy stays joy");

const packed = encodeWeekCard(
  {
    from: "2026-09-21",
    to: "2026-09-27",
    weights: [82.4, 82.1, 81.9, 81.6, 81.4, 81.2, 81],
    lifts: [
      { name: "абвгдежзийкл", start: 140.5, end: 142.5 },
      { name: "Жим лёжа узк", start: 100, end: 102.5 },
      { name: "Румынская тя", start: 160, end: 162.5 },
    ],
    macros: [
      { key: "protein", fact: 180.5, target: 200 },
      { key: "fat", fact: 70, target: 75 },
      { key: "carbs", fact: 250, target: 280 },
    ],
    gymDays: 4,
  },
  SECRET,
);
assert(
  packed.length <= WEEK_CARD_QUERY_LIMIT,
  "full card still fits the query",
);

const svg = weekCardSvg(card, "");
assert(svg.includes(WEEK_CARD_HEADING), "poster title");
assert(!svg.includes("Твой прогресс"), "shared card does not say your");
assert(svg.includes("81,6 кг"), "last weight");
assert(svg.includes("−0,8"), "weight fell");
assert(svg.includes("#1F7A4D"), "falling weight is green");
assert(svg.includes("Присед"), "squat is on the card");
assert(svg.includes("140 → 142,5"), "working weight rose");
assert(svg.includes("в цели"), "macros in the green zone");
assert(!svg.includes(">90<"), "outside weigh-in stays off");
assertEqual(
  weekCardCaption(card),
  "Как прошла неделя · 21–27 сент",
  "caption is the week",
);
assertEqual(
  weekCardPhotoUrl("https://diary.example", query),
  `https://diary.example/api/share/card?q=${encodeURIComponent(query)}`,
  "photo is the card jpeg",
);
assertEqual(WEEK_CARD_BUTTON, "Повторить в YeahBuddy", "chat button");
assert(WEEK_PROGRESS_HINT.includes("чат"), "hint says where it goes");

console.log("week card ok");
