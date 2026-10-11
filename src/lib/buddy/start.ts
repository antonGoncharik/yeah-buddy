import { makePackStart } from "@/lib/share/start-prefix";

/** Longer than a pack token, so a random pack link is not a buddy link. */
export const BUDDY_START_PREFIX = "b_";

const buddyStart = makePackStart(BUDDY_START_PREFIX);

export const buddyStartPayload = buddyStart.payload;
export const parseBuddyStartPayload = buddyStart.parse;
export const readBuddyToken = buddyStart.read;
