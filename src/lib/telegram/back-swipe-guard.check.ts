import {
  decideBackPop,
  isExactTabRoot,
} from "@/lib/telegram/back-swipe-guard";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(isExactTabRoot("/today"), true, "today root");
assertEqual(isExactTabRoot("/today/week"), false, "today sub");
assertEqual(isExactTabRoot("/settings/meals"), false, "settings sub");

assertEqual(
  decideBackPop({ exitArmed: false }, "/today/meals/x", "/today"),
  { decision: "reset", next: { exitArmed: false } },
  "meal back to today resets",
);

assertEqual(
  decideBackPop({ exitArmed: false }, "/today", "/today"),
  { decision: "arm", next: { exitArmed: true } },
  "first back on tab root arms",
);

assertEqual(
  decideBackPop({ exitArmed: true }, "/today", "/today"),
  { decision: "pass", next: { exitArmed: false } },
  "second back on tab root passes",
);
