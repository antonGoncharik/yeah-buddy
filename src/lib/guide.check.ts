import {
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

assert(GUIDE_PAGES.length >= 9, "guide covers a full walkthrough");
assert(GUIDE_TIPS.length === 2, "today and workouts tips");

const ids = GUIDE_PAGES.map((page) => page.id);
assertEqual(new Set(ids).size, ids.length, "page ids unique");

for (const page of GUIDE_PAGES) {
  const text = guidePageText(page);
  assert(page.title.trim().length > 0, `${page.id} has title`);
  assert(page.lead.trim().length >= 40, `${page.id} lead is not a teaser`);
  assert(page.paragraphs.length >= 2, `${page.id} has body`);
  assert(text.length >= 280, `${page.id} is a real page, not a card teaser`);
  assert(page.remember.trim().length >= 24, `${page.id} has a takeaway`);
  assert(
    (GUIDE_DOODLES as readonly string[]).includes(page.doodle),
    `${page.id} doodle`,
  );
}

const blob = guideAllText().toLowerCase();
for (const needle of GUIDE_TOPIC_NEEDLES) {
  assert(blob.includes(needle), `guide covers «${needle}»`);
}

assertEqual(guidePageById("what")?.title, "Что это", "first page");
assertEqual(guidePageById("missing"), null, "unknown page");
assertEqual(guideTipById("today")?.title, "Сегодня", "today tip");
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
