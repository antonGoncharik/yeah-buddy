export {
  DEFAULT_TIMEZONE,
  isCronAuthorized,
  isoWeekdaySun0,
  localClock,
  MIDDAY_REMINDER_HOUR,
  middayReminderDateIfDue,
  REMINDER_HOUR,
  rememberUserTimezone,
  reminderDateIfDue,
  resolveTimeZone,
} from "./reminder-clock";
export type {
  ReminderCronShard,
  ReminderRunResult,
  RemindersCronResult,
} from "./reminder-run";
export {
  reminderShardTotalFromEnv,
  runEveningReminders,
  runMiddayReminders,
  runRemindersCron,
  runRemindersCronAll,
} from "./reminder-run";

export function parseReminderCronShard(
  request: Request,
): import("./reminder-run").ReminderCronShard | undefined {
  const params = new URL(request.url).searchParams;
  const indexRaw = params.get("shard");
  const totalRaw = params.get("shards");
  if (indexRaw == null || totalRaw == null) {
    return undefined;
  }
  const index = Number(indexRaw);
  const total = Number(totalRaw);
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    total < 2 ||
    index < 0 ||
    index >= total
  ) {
    return undefined;
  }
  return { index, total };
}
export type { ReminderFacts } from "./reminder-text";
export {
  gymClosedForReminder,
  gymDoneForReminder,
  reminderText,
} from "./reminder-text";
