import {
  REMINDER_FAIL_PAUSE_THRESHOLD,
  reminderSendPaused,
} from "@/lib/telegram/reminder-fail-count";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

export default (async () => {
  assert(!reminderSendPaused(0), "zero not paused");
  assert(
    !reminderSendPaused(REMINDER_FAIL_PAUSE_THRESHOLD - 1),
    "below threshold",
  );
  assert(reminderSendPaused(REMINDER_FAIL_PAUSE_THRESHOLD), "at threshold");
})();
