import type { PhaseCircleProgress } from "@/lib/types";
import {
  completePhaseHint,
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

console.log("workout hints ok");
