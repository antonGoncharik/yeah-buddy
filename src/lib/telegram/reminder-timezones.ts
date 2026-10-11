import {
  localClock,
  middayReminderDateIfDue,
  reminderDateIfDue,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";

/** Raw timezone strings from user_settings that are in the evening reminder window. */
export function eveningDueTimezoneKeys(
  distinctTimezones: readonly string[],
  now: Date,
): string[] {
  return distinctTimezones.filter((raw) => {
    const clock = localClock(now, resolveTimeZone(raw));
    return reminderDateIfDue(clock) != null;
  });
}

/** Raw timezone strings from user_settings that are in the midday reminder window. */
export function middayDueTimezoneKeys(
  distinctTimezones: readonly string[],
  now: Date,
): string[] {
  return distinctTimezones.filter((raw) => {
    const clock = localClock(now, resolveTimeZone(raw));
    return middayReminderDateIfDue(clock) != null;
  });
}
