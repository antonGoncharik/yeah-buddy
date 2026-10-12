import {
  localClock,
  MIDDAY_REMINDER_HOUR,
  resolveTimeZone,
} from "@/lib/telegram/reminder-clock";

const EVENING_PREFILTER_HOUR = 17;
const MIDDAY_PREFILTER_END_HOUR = 23;

/** Raw timezone strings from user_settings that are in the evening reminder window. */
export function eveningDueTimezoneKeys(
  distinctTimezones: readonly string[],
  now: Date,
): string[] {
  return distinctTimezones.filter((raw) => {
    const clock = localClock(now, resolveTimeZone(raw));
    return clock.hour >= EVENING_PREFILTER_HOUR;
  });
}

/** Raw timezone strings from user_settings that are in the midday reminder window. */
export function middayDueTimezoneKeys(
  distinctTimezones: readonly string[],
  now: Date,
): string[] {
  return distinctTimezones.filter((raw) => {
    const clock = localClock(now, resolveTimeZone(raw));
    return (
      clock.hour >= MIDDAY_REMINDER_HOUR &&
      clock.hour <= MIDDAY_PREFILTER_END_HOUR
    );
  });
}
