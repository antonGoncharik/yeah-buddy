import {
  BUDDY_LINK_DEAD,
  BUDDY_LINK_LIMIT,
  BUDDY_LINK_OWN,
  BUDDY_LINK_TAKEN,
  BUDDY_LINK_UNAVAILABLE,
} from "@/lib/messages";

export class BuddyNotFoundError extends Error {
  constructor() {
    super(BUDDY_LINK_DEAD);
  }
}

export class BuddyTakenError extends Error {
  constructor() {
    super(BUDDY_LINK_TAKEN);
  }
}

export class BuddyOwnError extends Error {
  constructor() {
    super(BUDDY_LINK_OWN);
  }
}

export class BuddyLimitError extends Error {
  constructor() {
    super(BUDDY_LINK_LIMIT);
  }
}

export class BuddyShareError extends Error {
  constructor() {
    super(BUDDY_LINK_UNAVAILABLE);
  }
}
