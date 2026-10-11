import {
  BuddyLimitError,
  BuddyNotFoundError,
  BuddyOwnError,
  BuddyShareError,
  BuddyTakenError,
} from "@/lib/buddy/errors";
import { createGrantStore, type IssuedGrantLink } from "@/lib/grants/store";
import { BUDDY_SHARE_TEXT } from "@/lib/messages";
import { getBuddyShareUrl } from "@/lib/telegram/bot";

const grants = createGrantStore({
  table: "buddy_grants",
  claimantColumn: "buddy_user_id",
  shareText: BUDDY_SHARE_TEXT,
  claimedFallback: "Друг",
  athleteFallback: "Подопечный",
  shareUrl: getBuddyShareUrl,
  boardAccess: "claimant",
  errors: {
    notFound: BuddyNotFoundError,
    taken: BuddyTakenError,
    own: BuddyOwnError,
    limit: BuddyLimitError,
    share: BuddyShareError,
  },
});

export type IssuedBuddyLink = IssuedGrantLink;

export const loadBuddyHome = grants.loadHome;
export const issueBuddyLink = grants.issueLink;
export const renewBuddyGrant = grants.renewGrant;
export const revokeBuddyGrant = grants.revokeGrant;
export const claimBuddyGrant = grants.claimGrant;
export const requireBuddyBoardGrant = grants.requireBoard;
