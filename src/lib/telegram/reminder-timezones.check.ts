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
  middayDueTimezoneKeys(["Europe/Moscow"], moscowEvening).length,
  0,
  "moscow 21:30 is not midday due",
);

console.log("reminder timezones ok");
