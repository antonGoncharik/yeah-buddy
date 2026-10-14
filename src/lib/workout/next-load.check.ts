import { upcomingWorkLine } from "@/lib/workout/next-load";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const exercises = [
  {
    name: "Жим",
    sets: [
      {
        id: "done",
        set_type: "work",
        is_completed: true,
        planned_weight: 60,
      },
      {
        id: "next",
        set_type: "work",
        is_completed: false,
        planned_weight: 80,
      },
    ],
  },
];

assertEqual(
  upcomingWorkLine(exercises, ["next"]),
  "Следующий: Жим 80 кг · На сторону: 25 + 5 кг",
  "the open set shows the bar",
);
assertEqual(
  upcomingWorkLine(
    [
      {
        name: "Тяга",
        sets: [
          {
            id: "db",
            set_type: "work",
            is_completed: false,
            planned_weight: 12.5,
          },
        ],
      },
    ],
    [],
  ),
  "Следующий: Тяга 12.5 кг",
  "a dumbbell has no plates",
);
assertEqual(
  upcomingWorkLine(
    [
      {
        name: "Планка",
        sets: [
          {
            id: "hold",
            set_type: "work",
            is_completed: false,
            planned_weight: null,
          },
        ],
      },
    ],
    ["hold"],
  ),
  null,
  "a hold without weight stays quiet",
);
