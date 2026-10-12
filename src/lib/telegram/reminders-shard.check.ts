import { parseReminderCronShard } from "@/lib/telegram/reminders";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const ok = parseReminderCronShard(
  new Request("https://app.test/api/cron/reminders?shard=1&shards=4"),
);
assert(ok?.index === 1 && ok?.total === 4, "parses shard");

assert(
  parseReminderCronShard(new Request("https://app.test/api/cron/reminders")) ===
    undefined,
  "missing shard params",
);

console.log("reminder cron shard ok");
