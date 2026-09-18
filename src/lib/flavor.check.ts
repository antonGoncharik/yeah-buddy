import {
  comebackLine,
  consecutiveProteinHits,
  firstDeloadLine,
  firstPhaseLine,
  foodSearchEasterEgg,
  hundredWeightLine,
  LATE_NIGHT_LINE,
  LIGHT_WEIGHT_LINE,
  loadingFlavor,
  loadingLine,
  macrosClosedLine,
  nightLoadingLine,
  overflowKcalLabel,
  proteinAlmostLine,
  proteinClosed,
  proteinWeekLine,
  STEADY_WEIGHT_LINE,
  sessionDoneHeadline,
  sessionDoneLead,
  sessionMilestoneLine,
  sessionRaiseLine,
  splashBeatProgress,
  steadyWeightLine,
} from "@/lib/flavor";
import type { PhaseCircleProgress } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const deload: PhaseCircleProgress = {
  phase_type: "deload",
  phase_name: "Сброс",
  next_phase_type: null,
  next_phase_name: null,
  last_in_cycle: true,
  increases_on_end: false,
  kg_increase_on_end: null,
  hold_weights: false,
  completed_count: 1,
  circle_size: 3,
  suggest_end: false,
};

assertEqual(loadingFlavor({ splash: true }), "boot", "splash is boot");
assertEqual(
  loadingFlavor({ title: "Читаю фото…" }),
  "food",
  "titled overlay is food",
);
assertEqual(loadingFlavor({}), "idle", "plain loader");
assertEqual(
  loadingLine("boot", 0),
  "Загрузка углеводами…",
  "boot hour 0 is the known line",
);
assertEqual(
  loadingLine("boot", 3_600_000),
  "Греем блины…",
  "boot rotates hourly",
);
assertEqual(loadingLine("idle", 0), "Загрузка…", "idle keeps Загрузка");

assertEqual(sessionDoneHeadline(null), "Готово", "no feel yet");
assertEqual(sessionDoneHeadline("easy"), "Yeah buddy.", "easy headline");
assertEqual(sessionDoneHeadline("close"), "Впритык.", "close headline");
assertEqual(sessionDoneHeadline("miss"), "Не пошло.", "miss headline");
assertEqual(sessionDoneLead(null), null, "no lead until feel");
assertEqual(sessionDoneLead("easy"), null, "easy lead stays in the headline");
assertEqual(sessionDoneLead("close"), "Так и надо.", "close lead");
assertEqual(sessionDoneLead("miss"), "Бывает. Записано как было.", "miss lead");
assertEqual(
  sessionRaiseLine(true, "easy"),
  "Где-то взял больше плана. 1ПМ сам не вырастет.",
  "above plan wins",
);
assertEqual(
  sessionRaiseLine(false, "easy"),
  "Можно поднять 1ПМ.",
  "easy raise without repeating Легко",
);
assertEqual(
  sessionRaiseLine(false, null),
  "Можно поднять 1ПМ.",
  "raise before feel",
);

assertEqual(sessionMilestoneLine(9), null, "not yet ten");
assertEqual(sessionMilestoneLine(1), "Первый. Yeah buddy.", "first session");
assertEqual(
  sessionMilestoneLine(10),
  "Десять. Уже не разовый заход.",
  "tenth session",
);
assertEqual(sessionMilestoneLine(50), "Пятьдесят. Yeah buddy.", "fiftieth");
assertEqual(
  sessionMilestoneLine(100),
  "Сотня. Можно не считать, но мы посчитали.",
  "hundredth",
);
assertEqual(sessionMilestoneLine(51), null, "after fifty is silent");

assertEqual(firstDeloadLine(null), null, "no cycle");
assertEqual(
  firstDeloadLine(deload),
  "Сброс. Легче — не значит зря.",
  "first deload session",
);
assertEqual(
  firstDeloadLine({ ...deload, completed_count: 0 }),
  "Сброс. Легче — не значит зря.",
  "just entered deload",
);
assertEqual(
  firstDeloadLine({ ...deload, completed_count: 2 }),
  null,
  "later deload is quiet",
);
assertEqual(
  firstDeloadLine({ ...deload, phase_type: "peak" }),
  null,
  "peak is not deload",
);
assertEqual(
  firstPhaseLine({ ...deload, phase_type: "peak", phase_name: "Рывок" }),
  "Рывок. Не плюсуй сгоряча.",
  "first peak",
);
assertEqual(
  firstPhaseLine({ ...deload, phase_type: "volume", phase_name: "Набор" }),
  "Набор. Тот же 1ПМ, больше работы.",
  "first volume",
);
assertEqual(
  firstPhaseLine({ ...deload, phase_type: "ramp" }),
  null,
  "ramp stays quiet",
);
assertEqual(
  comebackLine("2026-09-15", "2026-09-01"),
  "Давно не были. Нормально.",
  "two weeks away",
);
assertEqual(
  comebackLine("2026-09-14", "2026-09-01"),
  null,
  "thirteen is early",
);
assertEqual(comebackLine("2026-09-15", null), null, "first has no comeback");

assertEqual(
  consecutiveProteinHits([
    { day: { fact_protein: 160, target_protein: 160 } },
    { day: { fact_protein: 161, target_protein: 160 } },
    { day: { fact_protein: 159.6, target_protein: 160 } },
    { day: { fact_protein: 180, target_protein: 160 } },
    { day: { fact_protein: 160, target_protein: 160 } },
    { day: { fact_protein: 200, target_protein: 160 } },
    { day: { fact_protein: 160, target_protein: 160 } },
  ]),
  7,
  "seven days closed",
);
assertEqual(
  consecutiveProteinHits([
    { day: { fact_protein: 100, target_protein: 160 } },
    { day: { fact_protein: 180, target_protein: 160 } },
  ]),
  0,
  "today miss breaks the streak",
);
assertEqual(
  consecutiveProteinHits([
    { day: null },
    { day: { fact_protein: 180, target_protein: 160 } },
  ]),
  0,
  "empty today breaks",
);
assertEqual(proteinWeekLine(6), null, "six is not the joke");
assertEqual(
  proteinWeekLine(7),
  "Белок семь дней подряд. Холодильник в курсе.",
  "week closed",
);

assertEqual(proteinClosed(0.4, 160), true, "protein hit");
assertEqual(proteinClosed(0.6, 160), false, "still leftover");
assertEqual(proteinClosed(0, 0), false, "empty day is not closed");
assertEqual(proteinClosed(-12, 180), true, "overflow is closed");
assertEqual(overflowKcalLabel(true), "Ну, праздник.", "kcal overflow");
assertEqual(overflowKcalLabel(false), "Осталось", "kcal leftover");

const steadyDates = Array.from({ length: 14 }, (_, index) => {
  const day = String(index + 1).padStart(2, "0");
  return [`2026-09-${day}`, 81] as const;
});
assertEqual(
  steadyWeightLine(new Map(steadyDates), "2026-09-14"),
  STEADY_WEIGHT_LINE,
  "fourteen same days",
);
assertEqual(
  steadyWeightLine(new Map(steadyDates.slice(1)), "2026-09-14"),
  null,
  "thirteen is not enough",
);
assertEqual(
  steadyWeightLine(
    new Map([
      ...steadyDates.slice(0, 7),
      ["2026-09-08", 81.2],
      ...steadyDates.slice(8),
    ]),
    "2026-09-14",
  ),
  null,
  "jump breaks the stand",
);
assertEqual(
  steadyWeightLine(
    new Map([
      ...steadyDates.slice(0, 7),
      ["2026-09-08", 81.04],
      ...steadyDates.slice(8),
    ]),
    "2026-09-14",
  ),
  STEADY_WEIGHT_LINE,
  "0.04 kg still counts",
);

assertEqual(proteinAlmostLine(3, 117), "Почти.", "a few grams left");
assertEqual(proteinAlmostLine(0.4, 160), null, "closed is not almost");
assertEqual(proteinAlmostLine(6, 114), null, "six grams is still work");
assertEqual(
  macrosClosedLine(
    { protein: 160, fat: 70, carbs: 200 },
    { target_protein: 160, target_fat: 70, target_carbs: 200 },
  ),
  "Три из трёх.",
  "all bars closed",
);
assertEqual(
  macrosClosedLine(
    { protein: 160, fat: 10, carbs: 200 },
    { target_protein: 160, target_fat: 70, target_carbs: 200 },
  ),
  null,
  "fat still open",
);
assertEqual(hundredWeightLine(100), "Сотня.", "even hundred");
assertEqual(hundredWeightLine(100.04), "Сотня.", "scale jitter");
assertEqual(hundredWeightLine(99.8), null, "not yet a hundred");
assertEqual(foodSearchEasterEgg("Ронни"), "Yeah buddy.", "ronnie search");
assertEqual(foodSearchEasterEgg("yeah buddy."), "Yeah buddy.", "full yeah");
assertEqual(foodSearchEasterEgg("ronnie"), "Yeah buddy.", "latin ronnie");
assertEqual(foodSearchEasterEgg("coleman"), "Yeah buddy.", "coleman");
assertEqual(
  foodSearchEasterEgg("light weight"),
  LIGHT_WEIGHT_LINE,
  "light weight search",
);
assertEqual(
  foodSearchEasterEgg("лёгкий вес"),
  LIGHT_WEIGHT_LINE,
  "ё maps to е",
);
assertEqual(foodSearchEasterEgg("овсянка"), null, "real food");
assertEqual(
  nightLoadingLine(new Date(2026, 8, 18, 2).getTime()),
  LATE_NIGHT_LINE,
  "2am boot",
);
assertEqual(
  nightLoadingLine(new Date(2026, 8, 18, 0).getTime()),
  null,
  "midnight keeps the usual line",
);
assertEqual(
  nightLoadingLine(new Date(2026, 8, 18, 14).getTime()),
  null,
  "afternoon is quiet",
);
assertEqual(splashBeatProgress(0, "mug"), 1, "first beat");
assertEqual(splashBeatProgress(1, "dumbbell"), 2, "second beat");
assertEqual(splashBeatProgress(1, "cookie"), 0, "wrong resets");
assertEqual(splashBeatProgress(1, "mug"), 1, "mug restarts");
assertEqual(splashBeatProgress(3, "barbell"), 4, "sequence done");
assertEqual(splashBeatProgress(4, "mug"), 4, "done stays done");

console.log("flavor ok");
