import { eveningReminderDateForCandidate } from "@/lib/telegram/reminder-clock";
import {
  eveningDueTimezoneKeys,
  middayDueTimezoneKeys,
} from "@/lib/telegram/reminder-timezones";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const moscowEvening = new Date("2026-03-15T18:30:00.000Z");
assertEqual(
  eveningDueTimezoneKeys(["Europe/Moscow"], moscowEvening).join(),
  "Europe/Moscow",
  "moscow 21:30 local is evening due",
);
assertEqual(
  eveningDueTimezoneKeys(
    ["Europe/Moscow"],
    new Date("2026-03-15T10:00:00.000Z"),
  ).length,
  0,
  "moscow noon is not evening due",
);

const moscowMidday = new Date("2026-03-15T10:00:00.000Z");
assertEqual(
  middayDueTimezoneKeys(["Europe/Moscow"], moscowMidday).join(),
  "Europe/Moscow",
  "moscow 13:00 local is midday due",
);
assertEqual(
  middayDueTimezoneKeys(["Europe/Moscow"], moscowEvening).join(),
  "Europe/Moscow",
  "moscow 21:30 stays in midday timezone prefilter until 23:00",
);

const moscowReminder17 = new Date("2026-03-15T15:00:00.000Z");
assertEqual(
  eveningDueTimezoneKeys(["Europe/Moscow"], moscowReminder17).join(),
  "Europe/Moscow",
  "moscow 18:00 enters evening prefilter for hour-17 users",
);
assertEqual(
  eveningDueTimezoneKeys(
    ["Europe/Moscow"],
    new Date("2026-03-15T13:59:00.000Z"),
  ).length,
  0,
  "moscow 16:59 skips evening prefilter",
);

assertEqual(
  eveningReminderDateForCandidate({ date: "2026-03-15", hour: 17 }, null, 17),
  "2026-03-15",
  "reminder hour 17 due at 17:00",
);

assertEqual(
  eveningReminderDateForCandidate(
    { date: "2026-03-16", hour: 2 },
    "2026-03-14",
    21,
  ),
  "2026-03-15",
  "catch-up sends yesterday before 03:00",
);

console.log("reminder timezones ok");
