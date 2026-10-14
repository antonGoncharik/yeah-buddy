import { portionChips } from "@/lib/food/portions";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const chips = portionChips({
  today: "2026-10-15",
  pieceGrams: 60,
  pieceLabel: "1 шт",
  logs: [
    { date: "2026-10-10", grams: 80 },
    { date: "2026-10-12", grams: 80 },
    { date: "2026-10-14", grams: 100 },
  ],
});

assertEqual(
  chips.map((chip) => chip.label),
  ["Как обычно · 80 г", "Вчера · 100 г", "1 шт · 60 г"],
  "usual, yesterday, and a named piece",
);

assertEqual(
  portionChips({
    today: "2026-10-15",
    logs: [{ date: "2026-10-15", grams: 150 }],
  }).map((chip) => chip.label),
  ["Сегодня · 150 г"],
  "one log is not yet a habit",
);

assertEqual(
  portionChips({
    today: "2026-10-15",
    pieceGrams: 50,
    pieceLabel: "50 г",
    logs: [
      { date: "2026-10-14", grams: 155 },
      { date: "2026-10-13", grams: 155 },
    ],
  }).map((chip) => chip.label),
  ["Как обычно · 155 г"],
  "a gram-only portion name is not a second chip",
);
