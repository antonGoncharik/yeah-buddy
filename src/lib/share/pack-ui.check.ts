import { isLiveOwnedPack } from "@/lib/share/pack-ui";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  isLiveOwnedPack({ mine: true, revoked: false, received: false }),
  "published pack is live owned",
);
assert(
  !isLiveOwnedPack({ mine: true, revoked: false, received: true }),
  "saved clone is not live owned",
);
assert(
  !isLiveOwnedPack({ mine: false, revoked: false, received: false }),
  "friend pack is not live owned",
);
