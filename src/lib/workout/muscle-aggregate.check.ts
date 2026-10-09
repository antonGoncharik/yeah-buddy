import {
  buildMuscleSnapshot,
  type ExerciseMuscleMeta,
} from "@/lib/workout/muscle-aggregate";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}`);
  }
}

const meta = new Map<string, ExerciseMuscleMeta>([
  [
    "ex-bench",
    {
      exercise_id: "ex-bench",
      name: "Жим",
      body_part: "chest",
      name_en: "bench press",
      name_ru: "Жим лёжа",
      equipment: "barbell",
    },
  ],
  [
    "ex-row",
    {
      exercise_id: "ex-row",
      name: "Тяга",
      body_part: "back",
      name_en: "barbell row",
      name_ru: "Тяга штанги",
      equipment: "barbell",
    },
  ],
]);

const snapshot = buildMuscleSnapshot({
  horizon_days: 14,
  since: "2026-09-27",
  until: "2026-10-10",
  today: "2026-10-10",
  metaByExercise: meta,
  sessions: [
    {
      session_id: "s1",
      session_date: "2026-10-08",
      status: "completed",
      template_id: "t1",
      exercises: [
        {
          exercise_id: "ex-bench",
          sets: [
            {
              set_type: "work",
              actual_weight: 80,
              planned_weight: null,
              actual_reps: 5,
              planned_reps: null,
            },
          ],
        },
      ],
    },
    {
      session_id: "s2",
      session_date: "2026-10-09",
      status: "skipped",
      template_id: "t-back",
      exercises: [],
    },
  ],
  templateExerciseIds: new Map([["t-back", ["ex-row"]]]),
  planned_template_name: "Спина",
  planned_exercise_ids: ["ex-row"],
});

const chest = snapshot.muscles.find((item) => item.id === "chest");
assertEqual(chest?.status, "trained", "bench trains chest");
assertEqual((chest?.work_sets ?? 0) > 0, true, "chest has work sets");

const lats = snapshot.muscles.find((item) => item.id === "lats");
assertEqual(lats?.status, "missed", "skipped back day flags lats");

const hits = snapshot.hits_by_muscle.chest?.[0]?.exercise_id;
assertEqual(hits, "ex-bench", "bench listed under chest");
