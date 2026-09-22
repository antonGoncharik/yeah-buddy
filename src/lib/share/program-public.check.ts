import {
  featuredProgramIdFromSlug,
  PUBLIC_PROGRAM_SLUGS,
  publicProgramCards,
  publicProgramPath,
  publicProgramUrl,
} from "@/lib/share/program-public";
import { FEATURED_PROGRAM_IDS } from "@/lib/share/program-start";

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

assertEqual(publicProgramPath("full_body"), "/p/full-body", "full body path");
assertEqual(publicProgramPath("five_by_five"), "/p/5x5", "5x5 path");
assertEqual(publicProgramPath("ppl"), "/p/ppl", "ppl path");
assertEqual(
  publicProgramUrl("https://yeahbuddy.app", "full_body"),
  "https://yeahbuddy.app/p/full-body",
  "absolute program url",
);
assertEqual(featuredProgramIdFromSlug("full-body"), "full_body", "slug");
assertEqual(featuredProgramIdFromSlug("5x5"), "five_by_five", "5x5 slug");
assertEqual(featuredProgramIdFromSlug("531"), null, "hidden preset");
assertEqual(featuredProgramIdFromSlug("ppl"), "ppl", "ppl slug");
assertEqual(featuredProgramIdFromSlug("full_body"), null, "id is not a slug");
assertEqual(featuredProgramIdFromSlug("five-by-five"), null, "unlisted preset");

const cards = publicProgramCards();
assertEqual(
  cards.map((card) => card.id),
  [...FEATURED_PROGRAM_IDS],
  "shelf is the three public programs",
);
assert(
  new Set(cards.map((card) => card.slug)).size === cards.length,
  "slugs are unique",
);
assert(
  Object.keys(PUBLIC_PROGRAM_SLUGS).length === FEATURED_PROGRAM_IDS.length,
  "every featured program has a public page",
);
for (const card of cards) {
  assert(card.name.trim() !== "", `${card.id} has a name`);
  assert(card.summary.trim() !== "", `${card.id} has a summary`);
  assert(!card.path.includes("t.me"), `${card.id} page is on the site`);
}

console.log("program public ok");
