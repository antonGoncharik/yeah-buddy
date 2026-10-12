import { reminderShardTotalFromEnv } from "@/lib/telegram/reminder-run";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

export default (async () => {
  const prev = process.env.REMINDER_SHARD_TOTAL;
  delete process.env.REMINDER_SHARD_TOTAL;
  assertEqual(reminderShardTotalFromEnv(), 1, "default one shard");

  process.env.REMINDER_SHARD_TOTAL = "4";
  assertEqual(reminderShardTotalFromEnv(), 4, "four shards");

  process.env.REMINDER_SHARD_TOTAL = "99";
  assertEqual(reminderShardTotalFromEnv(), 1, "invalid falls back");

  if (prev === undefined) {
    delete process.env.REMINDER_SHARD_TOTAL;
  } else {
    process.env.REMINDER_SHARD_TOTAL = prev;
  }
})();
