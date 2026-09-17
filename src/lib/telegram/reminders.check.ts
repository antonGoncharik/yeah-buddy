import {
  composeReminderMessage,
  weekRecapText,
} from "@/lib/telegram/reminder-recap";
import {
  isCronAuthorized,
  isoWeekdaySun0,
  isReminderHour,
  localClock,
  reminderDateForClock,
  reminderText,
  resolveTimeZone,
} from "@/lib/telegram/reminders";
import { timezoneCaption } from "@/lib/telegram/timezone-label";

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

assertEqual(
  reminderDateForClock({ date: "2026-09-11", hour: 20 }),
  "2026-09-11",
  "20:00 is tonight",
);
assertEqual(
  reminderDateForClock({ date: "2026-09-11", hour: 21 }),
  "2026-09-11",
  "after 20:00 still tonight",
);
assertEqual(
  reminderDateForClock({ date: "2026-09-11", hour: 19 }),
  "2026-09-10",
  "before 20:00 catches last night",
);
assertEqual(
  reminderDateForClock({ date: "2026-09-01", hour: 3 }),
  "2026-08-31",
  "early morning catches previous month",
);
assertEqual(isoWeekdaySun0("2026-09-13"), 0, "sunday");
assertEqual(isoWeekdaySun0("2026-09-17"), 4, "thursday");
assertEqual(
  timezoneCaption("Europe/Moscow", new Date("2026-09-11T17:00:00.000Z")),
  "Europe/Moscow · сейчас 20:00",
  "moscow caption",
);

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
  "Сегодня Сила A.",
  "food done gym still due",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: true,
    nextTemplateName: "Сила A",
  }),
  "День еды пустой. Холодильник сам не запишет.",
  "gym done food still empty",
);
assertEqual(
  reminderText({
    foodLogged: true,
    gymLogged: true,
    nextTemplateName: "Сила A",
  }),
  "Yeah buddy.",
  "both logged is Yeah buddy",
);
assertEqual(
  reminderText({
    foodLogged: true,
    gymLogged: false,
    nextTemplateName: null,
  }),
  null,
  "food done and no circle",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: false,
    nextTemplateName: null,
  }),
  "День еды пустой. Холодильник сам не запишет.",
  "food only",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymLogged: false,
    nextTemplateName: "Сила A",
  }),
  "День еды пустой. Холодильник сам не запишет.\nСегодня Сила A.",
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

assertEqual(
  composeReminderMessage(
    "Yeah buddy.",
    "За 14 дней:\nБелок дотянули: 5 из 7 дней.",
  ),
  "Yeah buddy.\n\nЗа 14 дней:\nБелок дотянули: 5 из 7 дней.",
  "sunday recap sits under yeah buddy",
);
assertEqual(
  composeReminderMessage(null, "За 14 дней:\nЗал: 4."),
  "За 14 дней:\nЗал: 4.",
  "recap alone when the day is already logged",
);
assertEqual(composeReminderMessage(null, null), null, "nothing to send");
assertEqual(
  weekRecapText(["Белок дотянули: 12 из 14 дней.", "Смотри ужин."]),
  "За 14 дней:\nБелок дотянули: 12 из 14 дней.",
  "only scoreboard lines",
);
assertEqual(weekRecapText(["Смотри ужин."]), null, "no scoreboard skips recap");

console.log("telegram reminders ok");
