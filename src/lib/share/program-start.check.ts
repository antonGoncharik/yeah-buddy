import {
  FEATURED_PROGRAM_IDS,
  featuredProgramPreset,
  featuredProgramView,
  isFeaturedProgramId,
  matchFeaturedPrograms,
  parseProgramStartPayload,
  programApplyConfirmMessage,
  programChatMessage,
  programPath,
  programStartPayload,
  readFeaturedProgramPayload,
} from "@/lib/share/program-start";
import { createPackToken, isPackToken } from "@/lib/share/token";
import { programPresetById } from "@/lib/workout/program-presets";

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

assert(FEATURED_PROGRAM_IDS.length === 3, "storefront is three programs");
for (const id of FEATURED_PROGRAM_IDS) {
  assert(programPresetById(id) != null, `${id} exists as a preset`);
  assertEqual(
    parseProgramStartPayload(programStartPayload(id)),
    id,
    `${id} roundtrip`,
  );
}

assertEqual(
  programStartPayload("full_body"),
  "p_full_body",
  "full body payload",
);
assertEqual(programStartPayload("ppl"), "p_ppl", "ppl payload");
assertEqual(
  parseProgramStartPayload("full_body"),
  null,
  "bare id is not a start",
);
assertEqual(
  parseProgramStartPayload("p_arnold"),
  null,
  "catalog is not the storefront",
);
assertEqual(
  parseProgramStartPayload("p_one_day"),
  null,
  "extra beginner stays inside",
);
assert(!isFeaturedProgramId("one_day"), "one day is not a bot object");
for (const id of [
  "five_three_one",
  "upper_lower",
  "press_two_week",
  "table_three_lifts",
  "table_squat",
  "arnold",
] as const) {
  assert(!isFeaturedProgramId(id), `${id} has no bot link`);
  assertEqual(
    parseProgramStartPayload(`p_${id}`),
    null,
    `${id} start payload stays closed`,
  );
}

assert(
  isPackToken("p_full_body"),
  "full body payload also looks like a pack token — parse program first",
);
assert(
  !isPackToken("p_ppl"),
  "short ppl payload is not a pack token — cannot reuse isPackToken",
);
assertEqual(
  parseProgramStartPayload(createPackToken()),
  null,
  "random pack is not a program",
);

assertEqual(programPath("five_by_five"), "/programs/five_by_five", "path");

assertEqual(
  matchFeaturedPrograms("").join(),
  FEATURED_PROGRAM_IDS.join(),
  "empty query is the storefront",
);
assertEqual(matchFeaturedPrograms("5x5").join(), "five_by_five", "5x5");
assertEqual(matchFeaturedPrograms("пять на пять").join(), "five_by_five", "5×5");
assertEqual(matchFeaturedPrograms("фуллбади").join(), "full_body", "фуллбади");
assertEqual(matchFeaturedPrograms("всё тело").join(), "full_body", "всё тело");
assertEqual(matchFeaturedPrograms("ppl").join(), "ppl", "ppl");
assertEqual(matchFeaturedPrograms("жим тяга").join(), "ppl", "жим тяга");
assertEqual(
  matchFeaturedPrograms("joy protein").join(),
  "",
  "joy is not a program",
);
assertEqual(matchFeaturedPrograms("x").join(), "", "one letter is not a match");

const fullBody = featuredProgramPreset("full_body");
const poster = programChatMessage(fullBody);
assert(poster.startsWith("Всё тело A/B"), "chat opens with the name");
assert(poster.includes("Тело A"), "chat lists day A");
assert(poster.includes("Тело B"), "chat lists day B");
assert(!poster.includes("От "), "bot-authored, no person");
assert(poster.includes("1ПМ"), "1RM stays in the gym");

const wave = programPresetById("five_three_one");
if (!wave) {
  throw new Error("5/3/1 stays in the data");
}
assert(
  programApplyConfirmMessage(wave).includes("недели"),
  "531 confirm mentions weeks",
);
assert(
  programApplyConfirmMessage(fullBody).includes("отложатся"),
  "full body confirm keeps old days",
);

const view = featuredProgramView(fullBody, {
  share_url: "https://t.me/yeahbuddybot?start=p_full_body",
  applied: false,
});
assertEqual(view.id, "full_body", "view id");
assert(view.days.length === 2, "two days");
assertEqual(
  readFeaturedProgramPayload({ program: view })?.id,
  "full_body",
  "payload roundtrip",
);
assertEqual(readFeaturedProgramPayload({}), null, "empty payload");

console.log("program start ok");
