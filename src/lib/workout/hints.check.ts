import { queueItemMark } from "@/lib/workout/hints";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: null,
    nextTemplateId: "legs",
  }),
  " · дальше",
  "next without a session is upcoming",
);

assertEqual(
  queueItemMark({
    templateId: "press",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  " · дальше",
  "next after today's session is upcoming, not today",
);

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  " · сегодня",
  "today's session template is today",
);

assertEqual(
  queueItemMark({
    templateId: "legs",
    sessionTemplateId: "legs",
    nextTemplateId: "legs",
  }),
  " · сегодня",
  "planned session that is still next stays today",
);

assertEqual(
  queueItemMark({
    templateId: "pull",
    sessionTemplateId: "legs",
    nextTemplateId: "press",
  }),
  "",
  "other templates stay unmarked",
);

console.log("workout hints ok");
