import {
  barbellInlineQuery,
  barbellShareCaption,
  matchBarbellInlineSearch,
  parseBarbellInlineQuery,
} from "@/lib/share/barbell-daily";
import { parseBarbellStartPayload } from "@/lib/share/barbell-start";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(parseBarbellStartPayload("barbell"), true, "barbell start");
assertEqual(parseBarbellStartPayload("open"), false, "open is not barbell");
assertEqual(
  barbellShareCaption({ targetKg: 80, moves: 3 }),
  "Собрал 80 кг за 3 блина\nЗадача дня · Yeah Buddy",
  "share caption without par",
);
assertEqual(
  barbellShareCaption({ targetKg: 80, moves: 3, parMoves: 2 }),
  "Собрал 80 кг за 3 блина 🟨\nПар 2\nЗадача дня · Yeah Buddy",
  "share caption with par",
);
assertEqual(
  barbellInlineQuery({ dayKey: "2026-10-01", targetKg: 80, moves: 3 }),
  "barbell 2026-10-01 80 3",
  "inline query",
);
assertEqual(
  parseBarbellInlineQuery("barbell 2026-10-01 80 3")?.moves,
  3,
  "parse inline",
);
assertEqual(
  parseBarbellInlineQuery("barbell 80 3")?.targetKg,
  80,
  "parse without day",
);
assertEqual(matchBarbellInlineSearch("собери штангу"), true, "alias search");
assertEqual(
  matchBarbellInlineSearch("yeah buddy"),
  false,
  "joy is not barbell",
);

console.log("barbell share ok");
