import type { ExerciseWithMax, PhaseCircleProgress } from "@/lib/types";
import {
  completePhaseHint,
  cycleSequenceLabel,
  cycleTimeline,
  phaseHoldHint,
  queueItemMark,
  templateCanPlan,
  templateMissingMaxes,
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

assertEqual(
  phaseHoldHint(circle),
  "Не пошло — 1ПМ не трогаем.",
  "hold copy",
);

assertEqual(
  completePhaseHint(circle),
  "Не пошло — 1ПМ не трогаем.",
  "hold beats raise on close",
);

assertEqual(
  completePhaseHint({ ...circle, hold_weights: false }),
  "Дальше «Рывок». Можно поднять 1ПМ — не всем сразу.",
  "raise when not holding",
);

assertEqual(
  completePhaseHint({
    ...circle,
    last_in_cycle: true,
    next_phase_type: null,
    next_phase_name: null,
  }),
  "Не пошло — 1ПМ не трогаем.",
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
  "Цикл закроется и начнётся новый. Можно поднять 1ПМ — не всем сразу.",
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
  "Цикл закроется и начнётся новый. Веса возьмём с последней тяжёлой недели.",
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

function exercise(
  id: string,
  max: number | null,
  preset: ExerciseWithMax["formula_preset"] = "barbell",
): ExerciseWithMax {
  return {
    id,
    user_id: "u",
    name: id,
    short_name: null,
    category: "base",
    workout_type: "dynamic",
    unit: "reps",
    weight_step: 2.5,
    formula_preset: preset,
    one_rm: null,
    slot: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    archived_at: null,
    current_max:
      max == null
        ? null
        : {
            id: `${id}-max`,
            user_id: "u",
            exercise_id: id,
            max_weight: max,
            achieved_at: "2026-01-01",
            phase_id: null,
            workout_session_id: null,
            created_at: "",
          },
    max_history: [],
    track: null,
  };
}

const squat = exercise("squat", 100);
const press = exercise("press", null);
const plank = exercise("plank", null, "none");
const template = { exercises: [squat, press, plank] };

assertEqual(
  templateCanPlan(template),
  true,
  "a workout can start when at least one exercise gets a plan",
);
assertEqual(
  templateCanPlan({ exercises: [plank] }),
  false,
  "only no-plan exercises cannot start a workout",
);
assertEqual(
  templateMissingMaxes(template, [squat, press, plank])
    .map((item) => item.id)
    .join(","),
  "press",
  "missing maxes lists exercises without a weight, skipping no-plan ones",
);
assertEqual(
  templateMissingMaxes(template, [squat, press, plank], ["press"]).length,
  0,
  "exercises already in the session are not missing",
);

console.log("workout hints ok");
