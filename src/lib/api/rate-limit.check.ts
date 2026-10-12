import { checkRateLimit } from "@/lib/api/rate-limit";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const first = checkRateLimit("test-key", 2, 60_000, 0);
assert(first.ok, "first ok");
const second = checkRateLimit("test-key", 2, 60_000, 1);
assert(second.ok, "second ok");
const third = checkRateLimit("test-key", 2, 60_000, 2);
assert(!third.ok, "third blocked");
if (!third.ok) {
  assert(third.retryAfterSec >= 1, "retry after");
}
