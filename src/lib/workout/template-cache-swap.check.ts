import assert from "node:assert/strict";

import { rewriteCachedTemplateExercise } from "@/lib/workout/template-cache-swap";

const nextExercise = {
  id: "row",
  name: "Тяга",
  short_name: null,
};

const hub = rewriteCachedTemplateExercise(
  {
    next_template: {
      id: "day-2",
      exercises: [{ id: "press", name: "Жим" }],
      slots: [{ exercise_id: "press", plan: { groups: [{ sets: 3 }] } }],
    },
  },
  "day-2",
  "press",
  nextExercise,
);

assert.equal(
  (hub as { next_template: { exercises: Array<{ id: string }> } }).next_template
    .exercises[0]?.id,
  "row",
);
assert.equal(
  (
    hub as {
      next_template: { slots: Array<{ exercise_id: string; plan: unknown }> };
    }
  ).next_template.slots[0]?.plan,
  null,
);

const list = rewriteCachedTemplateExercise(
  {
    templates: [
      {
        id: "day-1",
        exercises: [{ id: "squat", name: "Присед" }],
        slots: [{ exercise_id: "squat", plan: null }],
      },
    ],
  },
  "day-2",
  "press",
  nextExercise,
);
assert.equal(
  (list as { templates: Array<{ exercises: Array<{ id: string }> }> })
    .templates[0]?.exercises[0]?.id,
  "squat",
);

console.log("template cache swap ok");
