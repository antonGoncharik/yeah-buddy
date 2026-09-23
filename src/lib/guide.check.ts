import {
  GUIDE_INTRO_PAGES,
  GUIDE_PAGES,
  GUIDE_TIPS,
  GUIDE_TOPIC_NEEDLES,
  guideAllText,
  guidePageById,
  guidePageText,
  guideTipById,
} from "@/lib/guide/copy";
import {
  emptyGuideSeen,
  isGuideTipId,
  isTipDismissed,
  parseGuideSeen,
  restoredGuideSeen,
  withDismissedTip,
} from "@/lib/guide/seen";
import { GUIDE_DOODLES } from "@/lib/guide/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assert(
  GUIDE_INTRO_PAGES.length >= 3 && GUIDE_INTRO_PAGES.length <= 5,
  "intro is short enough to read before setup",
);
assert(GUIDE_PAGES.length >= 6, "reference covers the whole diary");
assert(GUIDE_TIPS.length === 4, "today, day type, body, and workouts tips");

const ids = [...GUIDE_INTRO_PAGES, ...GUIDE_PAGES].map((page) => page.id);
assertEqual(new Set(ids).size, ids.length, "page ids unique");

for (const page of GUIDE_INTRO_PAGES) {
  const text = guidePageText(page);
  assert(page.title.trim().length > 0, `${page.id} has title`);
  assert(page.lead.trim().length >= 40, `${page.id} lead is a sentence`);
  assert(
    page.paragraphs.length >= 1 && page.paragraphs.length <= 3,
    `${page.id} intro stays short`,
  );
  assert(text.length <= 900, `${page.id} intro fits one screen`);
  if (page.remember) {
    assert(page.remember.trim().length >= 24, `${page.id} has a takeaway`);
  }
  assert(
    (GUIDE_DOODLES as readonly string[]).includes(page.doodle),
    `${page.id} doodle`,
  );
}

const introGym = GUIDE_INTRO_PAGES.find((page) => page.id === "intro-gym");
assert(introGym != null, "intro-gym exists");
assert(introGym?.remember == null, "intro-gym has no remember takeaway");
const introFood = GUIDE_INTRO_PAGES.find((page) => page.id === "intro-food");
assert(introFood != null, "intro-food exists");
assert(introFood?.remember == null, "intro-food has no remember takeaway");
assert(
  !guideAllText().includes("1ПМ"),
  "guide never uses the 1ПМ abbreviation",
);
assert(
  !GUIDE_INTRO_PAGES.some((page) =>
    guidePageText(page).includes("очередь или"),
  ),
  "intro does not explain the day with «очередь»",
);
assert(
  GUIDE_INTRO_PAGES.some(
    (page) =>
      page.lead.includes("сколько его ещё съесть") &&
      page.lead.includes("без зала"),
  ),
  "intro food lead says protein left and no-gym vs gym",
);
assert(
  !GUIDE_INTRO_PAGES.some((page) =>
    (page.remember ?? "").includes(
      "Сначала отметь, какой это день — отдых или тренировка",
    ),
  ),
  "intro food has no rest-vs-training remember",
);
assert(
  guidePageById("day")?.remember?.includes(
    "Сначала отметь, какой это день. Потом записывай еду",
  ) === true,
  "day page keeps the longer remember",
);
assert(
  !guideAllText().includes("овсянка, яйца, курица, творог"),
  "guide does not promise a prefilled example day",
);

for (const page of GUIDE_PAGES) {
  const text = guidePageText(page);
  assert(page.title.trim().length > 0, `${page.id} has title`);
  assert(page.lead.trim().length >= 40, `${page.id} lead is not a teaser`);
  assert(page.paragraphs.length >= 2, `${page.id} has body`);
  assert(text.length >= 280, `${page.id} is a real page, not a card teaser`);
  if (page.remember) {
    assert(page.remember.trim().length >= 24, `${page.id} has a takeaway`);
  }
  assert(
    (GUIDE_DOODLES as readonly string[]).includes(page.doodle),
    `${page.id} doodle`,
  );
}

for (const page of [...GUIDE_INTRO_PAGES, ...GUIDE_PAGES]) {
  for (const line of [page.lead, ...page.paragraphs, page.remember ?? ""]) {
    if (!line) continue;
    assert(
      /[.!?…»)]$/.test(line.trim()),
      `${page.id} line ends as a sentence: ${line}`,
    );
  }
}

const blob = guideAllText().toLowerCase();
for (const needle of GUIDE_TOPIC_NEEDLES) {
  assert(blob.includes(needle), `guide covers «${needle}»`);
}

assertEqual(guidePageById("what")?.title, "Что это", "first page");
assertEqual(guidePageById("missing"), null, "unknown page");
assertEqual(guideTipById("today")?.title, "Сегодня", "today tip");
assertEqual(guideTipById("body")?.title, "Вес и талия", "body tip");
assertEqual(guideTipById("workouts")?.id, "workouts", "workouts tip");

assert(isGuideTipId("today"), "today is a tip id");
assert(!isGuideTipId("protein"), "protein is not a tip");

assertEqual(parseGuideSeen(null).dismissed.length, 0, "null seen");
assertEqual(parseGuideSeen("{").dismissed.length, 0, "broken json");
assertEqual(
  parseGuideSeen({ dismissed: ["today", "nope", "today"] }).dismissed.join(),
  "today",
  "drops junk and dupes",
);

const dismissed = withDismissedTip(emptyGuideSeen(), "today");
assert(isTipDismissed(dismissed, "today"), "dismiss today");
assert(!isTipDismissed(dismissed, "workouts"), "workouts still on");
assertEqual(
  withDismissedTip(dismissed, "today").dismissed.join(),
  "today",
  "dismiss is idempotent",
);
assertEqual(restoredGuideSeen().dismissed.length, 0, "restore clears tips");

console.log("guide copy ok");
