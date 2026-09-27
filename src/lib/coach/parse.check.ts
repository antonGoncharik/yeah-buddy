import {
  readCoachBoard,
  readCoachClaim,
  readCoachHome,
} from "@/lib/coach/parse";

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

const home = readCoachHome({
  outgoing: [
    {
      id: "g1",
      expires_at: "2026-10-27T00:00:00.000Z",
      claimed: false,
      person: null,
    },
  ],
  athletes: [
    {
      id: "g2",
      expires_at: "2026-10-27T00:00:00.000Z",
      person: "Анна",
    },
  ],
});
assertEqual(home?.outgoing[0]?.person, null, "unclaimed coach");
assertEqual(home?.athletes[0]?.person, "Анна", "athlete name");
assertEqual(readCoachHome({ outgoing: [] }), null, "home needs both lists");
assertEqual(readCoachClaim({ id: "g1" }), { id: "g1" }, "claim id");
assertEqual(readCoachClaim({}), null, "claim without id");

const board = readCoachBoard({
  board: {
    id: "g1",
    athlete_name: "Анна",
    expires_at: "2026-10-27T00:00:00.000Z",
    today: "2026-09-27",
    weight: { kg: 81.4, date: "2026-09-27" },
    days: [
      {
        date: "2026-09-27",
        training: true,
        caught_up: false,
        target_protein: 180,
        target_kcal: 2200,
        protein: 140,
        fat: 50,
        carbs: 200,
        kcal: 1800,
        body_weight: 81.4,
        protein_short: true,
        meals: [
          {
            label: "Обед",
            items: [{ name: "Курица", grams: 150, protein: 35, kcal: 180 }],
          },
        ],
        gym: {
          tone: "short",
          title: "Жим",
          headline: "Ниже плана",
          lines: ["Жим 70×6 · план 80×8"],
        },
      },
    ],
  },
});
assert(board?.days[0]?.protein_short === true, "reads a day");
assertEqual(board?.weight?.kg, 81.4, "morning weight");
assertEqual(
  readCoachBoard({ board: { id: "g1" } }),
  null,
  "rejects a thin board",
);
assertEqual(
  readCoachBoard({
    board: {
      id: "g1",
      athlete_name: "Анна",
      expires_at: "2026-10-27",
      today: "2026-09-27",
      weight: { kg: 0, date: "2026-09-27" },
      days: [],
    },
  })?.weight,
  null,
  "drops a zero weight",
);

console.log("coach parse ok");
