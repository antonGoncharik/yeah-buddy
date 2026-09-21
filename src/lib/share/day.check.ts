import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  dayInlineQuery,
  dayShareCard,
  dayShareDoodle,
  dayShareFacts,
  dayShareGym,
  dayShareGymLine,
  parseDayInlineQuery,
} from "@/lib/share/day";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  dayShareGym({ sessionStatus: "completed", isTrainingDay: true }),
  "gym",
  "closed session is gym",
);
assertEqual(
  dayShareGym({ sessionStatus: "skipped", isTrainingDay: true }),
  "none",
  "skip is not gym",
);
assertEqual(
  dayShareGym({ sessionStatus: "planned", isTrainingDay: true }),
  "none",
  "open session is not gym",
);
assertEqual(
  dayShareGym({ sessionStatus: null, isTrainingDay: false }),
  "rest",
  "rest day",
);
assertEqual(
  dayShareGym({ sessionStatus: null, isTrainingDay: true }),
  "none",
  "training day without session",
);
assertEqual(
  dayShareGym({ sessionStatus: null, isTrainingDay: null }),
  "none",
  "unopened day",
);

assertEqual(dayShareGymLine("gym"), "Зал был", "gym line");
assertEqual(dayShareGymLine("rest"), "Отдых", "rest line");
assertEqual(dayShareGymLine("none"), "Зала не было", "missed gym line");

const logged = dayShareFacts({
  protein: 142.4,
  kcal: 2100.2,
  sessionStatus: "completed",
  isTrainingDay: true,
});
assertEqual(
  dayShareCard(logged),
  `Б ${formatMacro(142.4)} г\n${formatKcal(2100.2)} ккал\nЗал был`,
  "day card has protein kcal gym",
);
assertEqual(
  dayShareDoodle({ protein: 142.4, targetProtein: 140 }),
  "cookie",
  "closed protein",
);
assertEqual(
  dayShareDoodle({ protein: 80, targetProtein: 140 }),
  "trex",
  "open protein",
);
assertEqual(
  dayShareDoodle({ protein: 0, targetProtein: 140 }),
  "trex",
  "empty food",
);

const query = dayInlineQuery(logged, "cookie");
assertEqual(query, "day 142.4 2100 gym cookie", "inline query");
assertEqual(
  parseDayInlineQuery(query),
  { facts: { protein: 142.4, kcal: 2100, gym: "gym" }, doodle: "cookie" },
  "round trip",
);
assertEqual(parseDayInlineQuery("joy session"), null, "joy stays joy");
assertEqual(parseDayInlineQuery("day"), null, "incomplete day query");
assertEqual(parseDayInlineQuery("day -1 2000 gym"), null, "negative protein");
assertEqual(
  parseDayInlineQuery("day 0 0 rest"),
  { facts: { protein: 0, kcal: 0, gym: "rest" }, doodle: "trex" },
  "empty rest day",
);

const card = dayShareCard({ protein: 0, kcal: 0, gym: "none" });
assertEqual(card.includes("вес"), false, "no body weight");
assertEqual(card.toLowerCase().includes("1пм"), false, "no 1rm");
assertEqual(card.includes("тарел"), false, "no plate");

console.log("day share ok");
