import assert from "node:assert/strict";

import {
  mealDraftStartPayload,
  parseMealDraftStartPayload,
} from "@/lib/meal-chat/start";
import { createPackToken, isPackToken } from "@/lib/share/token";

const token = createPackToken();
const payload = mealDraftStartPayload(token);

assert.equal(parseMealDraftStartPayload(payload), token, "roundtrip");
assert.equal(parseMealDraftStartPayload(token), null, "raw token is not start");
assert.equal(isPackToken(payload), true, "payload still matches pack charset");

console.log("meal chat start ok");
