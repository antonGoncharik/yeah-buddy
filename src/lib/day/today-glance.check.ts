import {
  buildTodayDayGlance,
  todayGlancePhase,
  todayGymActionHint,
} from "@/lib/day/today-glance";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(todayGlancePhase(8), "morning", "8 is morning");
assertEqual(todayGlancePhase(11), "morning", "11 is morning");
assertEqual(todayGlancePhase(12), "day", "noon is day");
assertEqual(todayGlancePhase(16), "day", "afternoon");
assertEqual(todayGlancePhase(17), "evening", "17 is evening");
assertEqual(todayGlancePhase(23), "evening", "late");

const evening = new Date("2026-10-06T20:00:00").getTime();
const morning = new Date("2026-10-06T09:00:00").getTime();

assertEqual(
  buildTodayDayGlance({
    protein: 150,
    targetProtein: 150,
    kcal: 2200,
    targetKcal: 2200,
    gym: { kind: "done", label: "Готово" },
    isTrainingDay: true,
    nowMs: evening,
  }).title,
  "День в порядке",
  "on-target evening",
);

const proteinGap = buildTodayDayGlance({
  protein: 80,
  targetProtein: 150,
  kcal: 1800,
  targetKcal: 2200,
  gym: { kind: "rest", label: "отдых" },
  isTrainingDay: false,
  nowMs: evening,
});
assertEqual(proteinGap.title, "Итог дня", "gap evening title");
assertEqual(
  proteinGap.lead,
  "Закрой белок: ещё 70,0 г.",
  "evening protein lead",
);
assertEqual(proteinGap.pillars[0].state, "warn", "protein warn");
assertEqual(proteinGap.pillars[2].state, "muted", "rest gym muted");

const queue = buildTodayDayGlance({
  protein: 150,
  targetProtein: 150,
  kcal: 2200,
  targetKcal: 2200,
  gym: { kind: "queue", label: "Жим" },
  isTrainingDay: true,
  nowMs: morning,
});
assertEqual(queue.title, "План на сегодня", "queue morning");
assertEqual(
  queue.lead,
  "В очереди «Жим» — зайди в Тренировки, когда будешь готов.",
  "queue lead wins",
);
assertEqual(queue.pillars[2].short, "Жим", "queue pill");

const open = buildTodayDayGlance({
  protein: 150,
  targetProtein: 150,
  kcal: 2200,
  targetKcal: 2200,
  gym: { kind: "open", label: "Тяга" },
  isTrainingDay: true,
  nowMs: evening,
});
assertEqual(
  open.lead,
  "«Тяга» не закрыта — допиши подходы или оставь на завтра.",
  "open session lead",
);

assertEqual(
  todayGymActionHint({
    protein: 80,
    targetProtein: 150,
    kcal: 1800,
    targetKcal: 2200,
    gym: { kind: "rest", label: "отдых" },
    isTrainingDay: false,
    nowMs: evening,
  }),
  null,
  "protein gap alone has no gym hint",
);
assertEqual(
  todayGymActionHint({
    protein: 150,
    targetProtein: 150,
    kcal: 2200,
    targetKcal: 2200,
    gym: { kind: "open", label: "Тяга" },
    isTrainingDay: true,
    nowMs: evening,
  }),
  open.lead,
  "open session surfaces in summary",
);

console.log("today glance ok");
