import { parseReviewOfferSeen, REVIEW_SEEN_KEY } from "@/lib/ai/review-seen";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(REVIEW_SEEN_KEY, "yb.review.offer", "storage key");
assert(!parseReviewOfferSeen(null), "null is unseen");
assert(!parseReviewOfferSeen("{"), "broken json is unseen");
assert(!parseReviewOfferSeen({}), "empty object is unseen");
assert(!parseReviewOfferSeen({ seen: false }), "seen false");
assert(parseReviewOfferSeen({ seen: true }), "seen true");
assert(parseReviewOfferSeen('{"seen":true}'), "json string seen");

console.log("review seen ok");
