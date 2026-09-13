import type { PhaseCircleProgress } from "@/lib/types";
import {
  completePhaseHint,
  cycleSequenceLabel,
  cycleTimeline,
  phaseHoldHint,
  queueItemMark,
} from "@/lib/workout/hints";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: null,
    nextTemplateId: "legs",
  }),
  " · дальше",
  "next without a session is upcoming",
);

assertEqual(
  queueItemMark({
    templateId: "press",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  " · дальше",
  "next after today's session is upcoming, not today",
);

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  " · сегодня",
  "today's session template is today",
);

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: "legs",
    nextTemplateId: "legs",
  }),
  " · сегодня",
  "planned session that is still next stays today",
);

assertEqual(
  queueItemMark({
    templateId: "pull",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  "",
  "other templates stay unmarked",
);

const circle: PhaseCircleProgress = {
  phase_type: "volume",
  phase_name: "Набор",
  next_phase_type: "peak",
  next_phase_name: "Рывок",
  last_in_cycle: false,
  increases_on_end: true,
  hold_weights: true,
  completed_count: 4,
  circle_size: 2,
  suggest_end: true,
};

assertEqual(phaseHoldHint(circle), "Не пошло. Держать веса.", "hold copy");

assertEqual(
  completePhaseHint(circle),
  "Не пошло. Держать веса, не сбрасывать.",
  "hold beats raise on close",
);

assertEqual(
  completePhaseHint({ ...circle, hold_weights: false }),
  "Дальше «Рывок». Можно поднять веса, не всем сразу.",
  "raise when not holding",
);

assertEqual(
  completePhaseHint({
    ...circle,
    last_in_cycle: true,
    next_phase_type: null,
    next_phase_name: null,
  }),
  "Не пошло. Держать веса, не сбрасывать.",
  "hold beats new cycle",
);

assertEqual(
  completePhaseHint({
    ...circle,
    last_in_cycle: true,
    hold_weights: false,
    next_phase_type: null,
    next_phase_name: null,
  }),
  "Закроется и начнётся новый. Можно поднять веса, не всем сразу.",
  "last stage still raises",
);

assertEqual(
  completePhaseHint({
    ...circle,
    last_in_cycle: true,
    hold_weights: false,
    increases_on_end: false,
    next_phase_type: null,
    next_phase_name: null,
  }),
  "Закроется и начнётся новый. Веса — с последней тяжёлой.",
  "last stage without raise keeps recap copy",
);

const planned = [
  { key: "ramp", name: "Разгон" },
  { key: "volume", name: "Набор" },
  { key: "peak", name: "Рывок" },
  { key: "deload", name: "Сброс" },
];

assertEqual(
  cycleSequenceLabel(planned),
  "Разгон → Набор → Рывок → Сброс",
  "full scheme label",
);

assertEqual(
  cycleTimeline(planned, "ramp")
    .map((step) => step.state)
    .join(","),
  "current,upcoming,upcoming,upcoming",
  "ramp shows the rest of the cycle",
);

assertEqual(
  cycleTimeline(planned, "peak")
    .map((step) => `${step.name}:${step.state}`)
    .join(","),
  "Разгон:completed,Набор:completed,Рывок:current,Сброс:upcoming",
  "peak marks earlier phases done",
);

assertEqual(
  cycleTimeline(
    [
      { key: "light", name: "Лёгкая" },
      { key: "heavy", name: "Тяжёлая" },
    ],
    "ramp",
    "Разгон",
  )
    .map((step) => `${step.name}:${step.state}`)
    .join(","),
  "Разгон:current,Лёгкая:upcoming,Тяжёлая:upcoming",
  "keeps the running phase if the scheme changed",
);

console.log("workout hints ok");
