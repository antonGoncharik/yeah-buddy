import {
  consecutiveProteinHits,
  firstDeloadLine,
  loadingFlavor,
  loadingLine,
  proteinWeekLine,
  sessionDoneHeadline,
  sessionDoneLead,
  sessionMilestoneLine,
  sessionRaiseLine,
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
assertEqual(
  sessionDoneLead(null),
  "Записано как в плане. Другой вес — поправь.",
  "default lead",
);
assertEqual(sessionDoneLead("close"), "Так и надо.", "close lead");
assertEqual(sessionDoneLead("miss"), "Бывает. Записано как было.", "miss lead");
assertEqual(
  sessionRaiseLine(true, "easy"),
  "Где-то больше плана. Рабочий сам не прыгнет.",
  "above plan wins",
);
assertEqual(
  sessionRaiseLine(false, "easy"),
  "Можно поднять рабочий.",
  "easy raise without repeating Легко",
);
assertEqual(
  sessionRaiseLine(false, null),
  "Легко. Можно поднять рабочий.",
  "raise before feel",
);

assertEqual(sessionMilestoneLine(9), null, "not yet ten");
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

console.log("flavor ok");
