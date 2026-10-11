import { makePackStart } from "@/lib/share/start-prefix";

/** Longer than a pack token, so a random pack link is not a coach link. */
export const COACH_START_PREFIX = "c_";

const coachStart = makePackStart(COACH_START_PREFIX);

export const coachStartPayload = coachStart.payload;
export const parseCoachStartPayload = coachStart.parse;
export const readCoachToken = coachStart.read;
