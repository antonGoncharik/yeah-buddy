export const GUIDE_DOODLES = [
  "mug",
  "cookie",
  "dumbbell",
  "barbell",
  "link",
] as const;

export type GuideDoodle = (typeof GUIDE_DOODLES)[number];

export const GUIDE_TIP_IDS = ["today", "workouts"] as const;

export type GuideTipId = (typeof GUIDE_TIP_IDS)[number];

export interface GuidePage {
  id: string;
  title: string;
  doodle: GuideDoodle;
  lead: string;
  paragraphs: string[];
  points?: string[];
  remember?: string;
}

export interface GuideTip {
  id: GuideTipId;
  title: string;
  body: string;
}

export interface GuideSeen {
  dismissed: GuideTipId[];
}
