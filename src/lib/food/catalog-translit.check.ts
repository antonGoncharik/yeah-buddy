import assert from "node:assert/strict";

import { foodMatchesQuery } from "@/lib/food/catalog-map";
import {
  latinTokenToCyrillic,
  textHasCyrillic,
  textHasLatin,
} from "@/lib/food/catalog-translit";

assert(textHasLatin("grechka"));
assert(textHasCyrillic("гречка"));
assert.equal(latinTokenToCyrillic("grechka"), "гречка");
assert.equal(latinTokenToCyrillic("tvorog"), "творог");

assert(
  foodMatchesQuery("Гречка", null, "grechka"),
  "latin query matches cyrillic catalog name",
);

export default Promise.resolve();
