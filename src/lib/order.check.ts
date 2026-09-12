import {
  assertSameIds,
  OrderMismatchError,
  orderRanks,
  sameIds,
} from "@/lib/order";

function assert(ok: boolean, label: string): void {
  if (!ok) {
    throw new Error(label);
  }
}

assert(sameIds(["a", "b"], ["b", "a"]), "same set in new order");
assert(!sameIds(["a", "b"], ["a"]), "length mismatch");
assert(!sameIds(["a", "b"], ["a", "a"]), "duplicate next");
assert(!sameIds(["a", "b"], ["a", "c"]), "unknown id");
assert(sameIds([], []), "empty lists");

try {
  assertSameIds(["a"], ["b"]);
  throw new Error("expected mismatch");
} catch (error) {
  assert(error instanceof OrderMismatchError, "mismatch throws");
}

const ranks = orderRanks(["x", "y"], 100);
assert(ranks[0]?.sort_order === 110, "base plus first rank");
assert(ranks[1]?.sort_order === 120, "base plus second rank");

console.log("order ok");
