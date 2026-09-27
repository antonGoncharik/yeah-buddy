import {
  COACH_LINK_DEAD,
  COACH_LINK_LIMIT,
  COACH_LINK_OWN,
  COACH_LINK_TAKEN,
  COACH_LINK_UNAVAILABLE,
} from "@/lib/messages";

export class CoachNotFoundError extends Error {
  constructor() {
    super(COACH_LINK_DEAD);
  }
}

export class CoachTakenError extends Error {
  constructor() {
    super(COACH_LINK_TAKEN);
  }
}

export class CoachOwnError extends Error {
  constructor() {
    super(COACH_LINK_OWN);
  }
}

export class CoachLimitError extends Error {
  constructor() {
    super(COACH_LINK_LIMIT);
  }
}

export class CoachShareError extends Error {
  constructor() {
    super(COACH_LINK_UNAVAILABLE);
  }
}
