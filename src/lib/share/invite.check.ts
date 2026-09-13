import { APP_NAME } from "@/lib/brand";
import { readInvitePayload } from "@/lib/share/invite";
import { publicPackDescription } from "@/lib/share/pack-meta";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  publicPackDescription("meals", null),
  "Еда на день. Можно поставить себе.",
  "meals without owner",
);
assertEqual(
  publicPackDescription("workouts", "Антон"),
  "От Антон. Программа тренировок. Можно поставить себе.",
  "workouts with owner",
);

assertEqual(
  readInvitePayload({ url: "https://t.me/bot", text: APP_NAME }),
  { url: "https://t.me/bot", text: APP_NAME },
  "invite payload",
);
assertEqual(readInvitePayload({ url: "  " }), null, "blank url");
assertEqual(readInvitePayload({ text: "hi" }), null, "missing url");

console.log("share invite meta ok");
