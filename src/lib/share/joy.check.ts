import { HUNDRED_WEIGHT_LINE, YEAH_BUDDY_LINE } from "@/lib/flavor";
import {
  BOT_INSTALL_DIARY,
  dayJoyMoment,
  heaviestWorkLift,
  JOY_PROTEIN_HITS,
  JOY_SESSION_COUNTS,
  joyInlineQuery,
  joyMomentFromRequest,
  joyShareCaption,
  parseJoyInlineQuery,
  SHARE_TO_CHAT,
  SHARE_WRITE_KG,
  sanitizeJoyLift,
  sessionJoyMoment,
} from "@/lib/share/joy";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  sessionJoyMoment({ feel: "miss", completedSessions: 3, workKg: 80 }),
  null,
  "miss is not a joy share",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 3, workKg: 80 }),
  null,
  "ordinary done is wallpaper",
);
assertEqual(
  sessionJoyMoment({ feel: null, completedSessions: 3, workKg: 80 }),
  null,
  "done without feel is silent",
);
assertEqual(
  sessionJoyMoment({ feel: "miss", completedSessions: 1, workKg: 80 }),
  null,
  "first miss is not a share",
);
assertEqual(
  [...JOY_SESSION_COUNTS],
  [1, 10, 50, 100],
  "share sessions are rare",
);
assertEqual(JOY_PROTEIN_HITS, 7, "protein share is a week");
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 1, workKg: 80 })?.line,
  "Первый. Yeah buddy.",
  "first workout shares",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 10, workKg: 80 })?.line,
  "Десять. Уже не разовый заход.",
  "tenth workout wins",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 25, workKg: 80 }),
  null,
  "twenty-five is flavor, not a share",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 50, workKg: 80 })?.line,
  "Пятьдесят. Yeah buddy.",
  "fiftieth workout",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 100, workKg: 80 })?.line,
  "Сотня. Можно не считать, но мы посчитали.",
  "hundredth workout",
);
assertEqual(
  sessionJoyMoment({ feel: "easy", completedSessions: 3, workKg: 100 })?.line,
  HUNDRED_WEIGHT_LINE,
  "hundred kilos on a work set",
);

assertEqual(
  dayJoyMoment({ proteinClosed: false, bodyWeight: 82 }),
  null,
  "open protein is silent",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 82 }),
  null,
  "protein closed is wallpaper",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 82, proteinHits: 4 }),
  null,
  "four-day protein is not a share",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 82, proteinHits: 7 })?.line,
  "Белок семь дней подряд. Холодильник в курсе.",
  "week of protein",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 82, proteinHits: 8 }),
  null,
  "day eight is wallpaper",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 82, proteinHits: 14 }),
  null,
  "two weeks is not a share",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 100 })?.line,
  HUNDRED_WEIGHT_LINE,
  "body-weight hundred wins over protein",
);
assertEqual(
  dayJoyMoment({ proteinClosed: true, bodyWeight: 100 })?.allowKg,
  false,
  "body weight stays off the message",
);

const squat = heaviestWorkLift([
  {
    exercise: { name: "Приседания", short_name: "Присед" },
    sets: [
      { set_type: "warmup", planned_weight: 60, actual_weight: 60 },
      { set_type: "work", planned_weight: 120, actual_weight: 140 },
    ],
  },
  {
    exercise: { name: "Жим лёжа", short_name: "Жим" },
    sets: [{ set_type: "work", planned_weight: 90, actual_weight: 90 }],
  },
]);
assertEqual(
  squat,
  { name: "Присед", kg: 140 },
  "heaviest work set, not warmup",
);
assertEqual(
  heaviestWorkLift([
    {
      exercise: { name: "Приседания", short_name: "Присед" },
      sets: [{ set_type: "work", planned_weight: 140, actual_weight: null }],
    },
  ]),
  { name: "Присед", kg: 140 },
  "planned work if actual is empty",
);

assertEqual(
  joyShareCaption(YEAH_BUDDY_LINE, squat, true),
  "Yeah buddy. Присед 140",
  "kg is opt-in on the same line",
);
assertEqual(
  joyShareCaption(YEAH_BUDDY_LINE, squat, false),
  YEAH_BUDDY_LINE,
  "default stays silent about kg",
);
assertEqual(
  sanitizeJoyLift({ name: "  Присед\n140  ", kg: 140 }),
  { name: "Присед 140", kg: 140 },
  "lift name collapses whitespace",
);
assertEqual(sanitizeJoyLift({ name: "Присед", kg: 0 }), null, "zero kg");
assertEqual(sanitizeJoyLift({ name: "Присед", kg: 1000 }), null, "unreal kg");

assertEqual(
  joyMomentFromRequest({ kind: "session", feel: "miss" }),
  null,
  "request miss rejected",
);
assertEqual(
  joyMomentFromRequest({ kind: "milestone", sessions: 9 }),
  null,
  "not a milestone",
);
assertEqual(
  joyMomentFromRequest({ kind: "hundred" })?.line,
  HUNDRED_WEIGHT_LINE,
  "hundred from request",
);

const moment = sessionJoyMoment({
  feel: "easy",
  completedSessions: 10,
  workKg: 80,
});
if (moment == null) {
  throw new Error("tenth session should share");
}
const query = joyInlineQuery(moment, squat);
assertEqual(query, "joy milestone 10 | Присед | 140", "inline query with kg");
assertEqual(
  parseJoyInlineQuery(query),
  {
    kind: "milestone",
    sessions: 10,
    lift: { name: "Присед", kg: 140 },
  },
  "roundtrip query",
);
assertEqual(
  parseJoyInlineQuery("joy protein"),
  {
    kind: "protein",
    proteinHits: 0,
    lift: null,
  },
  "protein query",
);
assertEqual(parseJoyInlineQuery("yeah buddy"), null, "plain text is not joy");

assertEqual(SHARE_TO_CHAT, "В чат", "chat button");
assertEqual(SHARE_WRITE_KG, "Написать кг", "kg is a separate gesture");
assertEqual(
  BOT_INSTALL_DIARY,
  "Поставить дневник",
  "friend installs from chat",
);

console.log("joy share ok");
