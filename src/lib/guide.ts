export {
  GUIDE_HINT,
  GUIDE_HREF,
  GUIDE_INTRO_PAGES,
  GUIDE_LABEL,
  GUIDE_PAGES,
  GUIDE_TIPS,
  GUIDE_TOPIC_NEEDLES,
  guideAllText,
  guidePageById,
  guidePageText,
  guideTipById,
} from "@/lib/guide/copy";
export {
  dismissGuideTip,
  emptyGuideSeen,
  GUIDE_SEEN_KEY,
  isGuideTipId,
  isTipDismissed,
  parseGuideSeen,
  readGuideSeen,
  restoredGuideSeen,
  restoreGuideTips,
  withDismissedTip,
  writeGuideSeen,
} from "@/lib/guide/seen";
export type {
  GuideDoodle,
  GuidePage,
  GuideSeen,
  GuideTip,
  GuideTipId,
} from "@/lib/guide/types";
