import { forwardDraft, maxFollowsWeek } from "@/lib/workout/macro-forward";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(maxFollowsWeek(100, 100), true, "same week");
assertEqual(maxFollowsWeek(100, 110), false, "peak week differs");
assertEqual(
  forwardDraft({
    weekDraft: "100",
    step: 2.5,
    increased: false,
    increasePercent: 5,
    pinned: null,
    override: undefined,
  }),
  null,
  "same number stays one field",
);
assertEqual(
  forwardDraft({
    weekDraft: "100",
    step: 2.5,
    increased: true,
    increasePercent: 5,
    pinned: null,
    override: undefined,
  }),
  "105",
  "raise shows the next max",
);
assertEqual(
  forwardDraft({
    weekDraft: "110",
    step: 2.5,
    increased: true,
    increasePercent: 5,
    pinned: 140,
    override: undefined,
  }),
  "140",
  "another week's max stays pinned",
);
assertEqual(
  forwardDraft({
    weekDraft: "100",
    step: 2.5,
    increased: true,
    increasePercent: 5,
    pinned: null,
    override: "108",
  }),
  "108",
  "typed next max wins",
);

console.log("macro forward ok");
