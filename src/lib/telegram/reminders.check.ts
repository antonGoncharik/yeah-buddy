import {
  isCronAuthorized,
  isReminderHour,
  localClock,
  reminderText,
  resolveTimeZone,
} from "@/lib/telegram/reminders";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(resolveTimeZone(null), "Europe/Moscow", "empty tz defaults");
assertEqual(resolveTimeZone("not-a-zone"), "Europe/Moscow", "invalid tz");
assertEqual(resolveTimeZone("UTC"), "UTC", "keeps valid tz");
assertEqual(isReminderHour(20), true, "eight pm");
assertEqual(isReminderHour(19), false, "too early");
assertEqual(isReminderHour(21), false, "too late");

const moscowEvening = localClock(
  new Date("2026-09-11T17:00:00.000Z"),
  "Europe/Moscow",
);
assertEqual(moscowEvening, { date: "2026-09-11", hour: 20 }, "Moscow 20:00");

const moscowNextDay = localClock(
  new Date("2026-09-11T21:30:00.000Z"),
  "Europe/Moscow",
);
assertEqual(moscowNextDay.date, "2026-09-12", "Moscow past midnight");
assertEqual(moscowNextDay.hour, 0, "Moscow 00:30");

const laYesterday = localClock(
  new Date("2026-09-11T04:00:00.000Z"),
  "America/Los_Angeles",
);
assertEqual(laYesterday.date, "2026-09-10", "LA still previous date");

assertEqual(
  reminderText({
    foodLogged: true,
    gymLogged: false,
    nextTemplateName: "Сила A",
  }),
  null,
  "food record is enough",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: true,
    nextTemplateName: "Сила A",
  }),
  null,
  "gym record is enough",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: false,
    nextTemplateName: null,
  }),
  "День еды пустой.",
  "food only",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: false,
    nextTemplateName: "Сила A",
  }),
  "День еды пустой.\nСегодня Сила A.",
  "food and circle",
);

const authorized = isCronAuthorized(
  new Request("https://example.test", {
    headers: { authorization: "Bearer secret" },
  }),
  "secret",
);
assertEqual(authorized, true, "bearer matches");
assertEqual(
  isCronAuthorized(
    new Request("https://example.test", {
      headers: { authorization: "Bearer other" },
    }),
    "secret",
  ),
  false,
  "bearer mismatch",
);
assertEqual(
  isCronAuthorized(new Request("https://example.test"), "secret"),
  false,
  "missing header",
);
assertEqual(
  isCronAuthorized(
    new Request("https://example.test", {
      headers: { authorization: "Bearer secret" },
    }),
    undefined,
  ),
  false,
  "missing secret fails closed",
);

console.log("telegram reminders ok");
