import {
  CoachLimitError,
  CoachNotFoundError,
  CoachOwnError,
  CoachShareError,
  CoachTakenError,
} from "@/lib/coach/errors";
import { createGrantStore, type IssuedGrantLink } from "@/lib/grants/store";
import { COACH_SHARE_TEXT } from "@/lib/messages";
import { getCoachShareUrl } from "@/lib/telegram/bot";

const grants = createGrantStore({
  table: "coach_grants",
  claimantColumn: "coach_user_id",
  shareText: COACH_SHARE_TEXT,
  claimedFallback: "Тренер",
  athleteFallback: "Подопечный",
  shareUrl: getCoachShareUrl,
  boardAccess: "athlete-or-claimant",
  errors: {
    notFound: CoachNotFoundError,
    taken: CoachTakenError,
    own: CoachOwnError,
    limit: CoachLimitError,
    share: CoachShareError,
  },
});

export type IssuedCoachLink = IssuedGrantLink;

export const loadCoachHome = grants.loadHome;
export const issueCoachLink = grants.issueLink;
export const renewCoachGrant = grants.renewGrant;
export const revokeCoachGrant = grants.revokeGrant;
export const claimCoachGrant = grants.claimGrant;
export const requireBoardGrant = grants.requireBoard;
