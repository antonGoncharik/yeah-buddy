import { APP_NAME } from "@/lib/brand";
import {
  INVITE_HREF,
  promptFirstProgramInvite,
  readInvitePayload,
  SHOW_PROGRAM_LABEL,
  showProgramInvite,
} from "@/lib/share/invite";
import { publicPackDescription } from "@/lib/share/pack-meta";
import { packChatMessage } from "@/lib/share/payload";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  publicPackDescription(null, "Отдых 2200 · зал 2600"),
  "Отдых 2200 · зал 2600",
  "meals poster without owner",
);
assertEqual(
  publicPackDescription("Антон", "Тело A / Тело B · присед, жим, тяга"),
  "От Антон. Тело A / Тело B · присед, жим, тяга",
  "workouts poster with owner",
);
assertEqual(
  packChatMessage("Антон", "Обед · творог, овсянка, банан, яйца"),
  "От Антон.\n\nОбед · творог, овсянка, банан, яйца",
  "bot pack message",
);

assertEqual(
  readInvitePayload({ url: "https://t.me/bot", text: APP_NAME }),
  { url: "https://t.me/bot", text: APP_NAME },
  "invite payload",
);
assertEqual(readInvitePayload({ url: "  " }), null, "blank url");
assertEqual(readInvitePayload({ text: "hi" }), null, "missing url");
assertEqual(INVITE_HREF, "/workouts/invite", "invite lives in the gym");
assertEqual(SHOW_PROGRAM_LABEL, "Показать программу другу", "invite label");
assertEqual(showProgramInvite(0), false, "before first session");
assertEqual(showProgramInvite(1), true, "after first session");
assertEqual(showProgramInvite(0, 1), true, "recent completed counts");
assertEqual(promptFirstProgramInvite(1), true, "prompt on first close");
assertEqual(promptFirstProgramInvite(2), false, "no repeat prompt");

console.log("share invite meta ok");
