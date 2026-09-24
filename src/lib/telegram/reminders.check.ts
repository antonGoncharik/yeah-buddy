import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  composeEveningMessage,
  composeReminderMessage,
  reminderDayCard,
  weekRecapText,
} from "@/lib/telegram/reminder-recap";
import {
  gymDoneForReminder,
  isCronAuthorized,
  isoWeekdaySun0,
  localClock,
  reminderDateIfDue,
  reminderText,
  resolveTimeZone,
} from "@/lib/telegram/reminders";
import {
  TIMEZONE_CHOICES,
  timezoneCaption,
  timezoneChoiceLabel,
  timezoneChoicesFor,
  timezoneZoneName,
} from "@/lib/telegram/timezone-label";

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
for (const choice of TIMEZONE_CHOICES) {
  assertEqual(resolveTimeZone(choice.id), choice.id, `${choice.id} is valid`);
}
assertEqual(
  reminderDateIfDue({ date: "2026-09-11", hour: 20 }),
  "2026-09-11",
  "20:00 is tonight",
);
assertEqual(
  reminderDateIfDue({ date: "2026-09-11", hour: 21 }),
  "2026-09-11",
  "after 20:00 still tonight",
);
assertEqual(
  reminderDateIfDue({ date: "2026-09-11", hour: 19 }),
  null,
  "before 20:00 waits",
);
assertEqual(
  reminderDateIfDue({ date: "2026-09-01", hour: 3 }),
  null,
  "morning waits for evening",
);
assertEqual(isoWeekdaySun0("2026-09-13"), 0, "sunday");
assertEqual(isoWeekdaySun0("2026-09-17"), 4, "thursday");
assertEqual(
  timezoneCaption("Europe/Moscow", new Date("2026-09-11T17:00:00.000Z")),
  "Москва · сейчас 20:00",
  "moscow caption",
);
assertEqual(
  timezoneZoneName("America/Los_Angeles"),
  "America/Los Angeles",
  "underscores become spaces",
);
assertEqual(timezoneChoiceLabel("Europe/Moscow"), "Москва", "moscow label");
assertEqual(
  timezoneChoicesFor("America/Los_Angeles")[0]?.id,
  "America/Los_Angeles",
  "unknown zone stays on the list",
);
assertEqual(
  timezoneChoicesFor("Europe/Moscow")[0]?.id,
  "Europe/Kaliningrad",
  "known zone is not duplicated",
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
  gymDoneForReminder({ isTrainingDay: true, sessionStatus: "completed" }),
  true,
  "closed session is done",
);
assertEqual(
  gymDoneForReminder({ isTrainingDay: true, sessionStatus: "planned" }),
  false,
  "open session is not done",
);
assertEqual(
  gymDoneForReminder({ isTrainingDay: false, sessionStatus: null }),
  true,
  "rest day is done",
);
assertEqual(
  gymDoneForReminder({ isTrainingDay: true, sessionStatus: null }),
  false,
  "training day without session is due",
);
assertEqual(
  gymDoneForReminder({ isTrainingDay: null, sessionStatus: null }),
  false,
  "unopened day is due",
);
assertEqual(
  gymDoneForReminder({ isTrainingDay: false, sessionStatus: "skipped" }),
  true,
  "skipped session is done",
);

assertEqual(
  reminderText({
    foodLogged: true,
    gymDone: false,
    nextTemplateName: "Сила A",
  }),
  "Тренировка «Сила A» ещё не закрыта. Можно дописать сейчас или оставить на завтра.",
  "food done gym still due",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymDone: true,
    nextTemplateName: "Сила A",
  }),
  "Еда за сегодня ещё пустая. Открой дневник — пока помнишь, что ел.",
  "gym done food still empty",
);
assertEqual(
  reminderText({
    foodLogged: true,
    gymDone: true,
    nextTemplateName: "Сила A",
  }),
  "День в порядке. Yeah buddy.",
  "both logged is Yeah buddy",
);
assertEqual(
  reminderText({
    foodLogged: true,
    gymDone: false,
    nextTemplateName: null,
  }),
  "День в порядке. Yeah buddy.",
  "food done and no circle",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymDone: false,
    nextTemplateName: null,
  }),
  "Еда за сегодня ещё пустая. Открой дневник — пока помнишь, что ел.",
  "food only",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymDone: false,
    nextTemplateName: "Сила A",
  }),
  "Еда за сегодня ещё пустая. Открой дневник — пока помнишь, что ел.\nТренировка «Сила A» ещё не закрыта. Можно дописать сейчас или оставить на завтра.",
  "food and circle",
);
assertEqual(
  reminderText({
    foodLogged: false,
    gymDone: true,
    gymClosed: false,
    nextTemplateName: "Сила A",
    early: true,
  }),
  "Еда за сегодня ещё пустая. Запиши пару приёмов — завтра будет что повторить.\nТренировка «Сила A» ещё не закрыта. Можно дописать сейчас или оставить на завтра.",
  "first evenings nag food and the queued gym even on rest",
);
assertEqual(
  reminderText({
    foodLogged: true,
    gymDone: true,
    gymClosed: true,
    nextTemplateName: "Сила A",
    early: true,
  }),
  "День в порядке. Yeah buddy.",
  "first evening stays quiet when the day is done",
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
    "День в порядке. Yeah buddy.",
    "За 14 дней:\nБелок дотянули: 5 из 7 дней.",
  ),
  "День в порядке. Yeah buddy.\n\nЗа 14 дней:\nБелок дотянули: 5 из 7 дней.",
  "sunday recap sits under yeah buddy",
);
assertEqual(
  composeReminderMessage(null, "За 14 дней:\nЗал: 4."),
  "За 14 дней:\nЗал: 4.",
  "recap alone when the day is already logged",
);
assertEqual(composeReminderMessage(null, null), null, "nothing to send");
assertEqual(
  composeEveningMessage(
    "День в порядке. Yeah buddy.",
    null,
    reminderDayCard({
      protein: 142,
      targetProtein: 150,
      kcal: 2100,
      gym: "gym",
    }),
  ),
  `День в порядке. Yeah buddy.\n\nБелок ${formatMacro(142)} из ${formatMacro(150)} г\n${formatKcal(2100)} ккал\nЗал был`,
  "evening text keeps the nag and the day card",
);
assertEqual(
  composeEveningMessage(
    null,
    null,
    reminderDayCard({
      protein: 0,
      targetProtein: 0,
      kcal: 0,
      gym: "rest",
    }),
  ),
  `Белок ${formatMacro(0)} г\n${formatKcal(0)} ккал\nОтдых`,
  "day card still sends without a nag",
);
assertEqual(
  reminderDayCard({
    protein: 142,
    targetProtein: 150,
    kcal: 2100,
    gym: "gym",
  }),
  `Белок ${formatMacro(142)} из ${formatMacro(150)} г\n${formatKcal(2100)} ккал\nЗал был`,
  "day card shows protein against the goal",
);
assertEqual(
  reminderDayCard({
    protein: 0,
    targetProtein: 0,
    kcal: 0,
    gym: "rest",
  }),
  `Белок ${formatMacro(0)} г\n${formatKcal(0)} ккал\nОтдых`,
  "day card without a goal stays plain",
);
assertEqual(
  weekRecapText(["Белок дотянули: 12 из 14 дней.", "Смотри ужин."]),
  "За 14 дней:\nБелок дотянули: 12 из 14 дней.",
  "only scoreboard lines",
);
assertEqual(weekRecapText(["Смотри ужин."]), null, "no scoreboard skips recap");

const vercel = JSON.parse(
  readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
) as { crons?: Array<{ path?: string; schedule?: string }> };
assertEqual(vercel.crons?.length, 24, "hourly via 24 daily jobs");
for (let hour = 0; hour < 24; hour += 1) {
  assertEqual(
    vercel.crons?.[hour]?.path,
    "/api/cron/reminders",
    `path ${hour}`,
  );
  assertEqual(
    vercel.crons?.[hour]?.schedule,
    `0 ${hour} * * *`,
    `hour ${hour}`,
  );
}

console.log("telegram reminders ok");
