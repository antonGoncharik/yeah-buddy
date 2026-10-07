import { BOT_INSTALL_DIARY } from "@/lib/share/joy";
import { botInlineResults } from "@/lib/share/prepared";
import {
  decodeSundayCard,
  encodeSundayCard,
  sundayCardCaption,
  sundayCardFromBrief,
  sundayCardFromCounts,
  sundayCardSvg,
} from "@/lib/share/sunday-card";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const secret = "sunday-card-secret";
const card = sundayCardFromCounts({
  from: "2026-09-21",
  to: "2026-10-04",
  proteinHit: 12,
  proteinDays: 14,
  gymSessions: 4,
});
assert(card != null, "two weeks of protein and gym");
if (!card) {
  throw new Error("card");
}

assertEqual(
  sundayCardFromCounts({
    from: "2026-09-21",
    to: "2026-10-04",
    proteinHit: 15,
    proteinDays: 14,
    gymSessions: 1,
  }),
  null,
  "protein hits cannot exceed logged days",
);
assertEqual(
  sundayCardFromCounts({
    from: "2026-09-01",
    to: "2026-10-04",
    proteinHit: 1,
    proteinDays: 1,
    gymSessions: 1,
  }),
  null,
  "longer than two weeks stays off the card",
);
assertEqual(
  sundayCardFromCounts({
    from: "2026-09-21",
    to: "2026-10-04",
    proteinHit: 0,
    proteinDays: 0,
    gymSessions: 0,
  }),
  null,
  "empty fortnight is not a card",
);
assertEqual(
  sundayCardFromBrief({
    from: "2026-09-21",
    to: "2026-10-04",
    coverage: "empty",
    nutrition: { protein_hit: 12, protein_total: 14 },
    gym: { completed: 4 },
  }),
  null,
  "empty coverage does not share",
);

const caption = sundayCardCaption(card);
assert(caption.includes("Белок в цели 12 из 14"), "protein line");
assert(caption.includes("4 тренировки"), "gym line");
assert(!caption.includes("кг"), "caption has no kilograms");
assert(!caption.toLowerCase().includes("вес"), "caption has no scale");
assert(!caption.toLowerCase().includes("максимум"), "caption has no max");

const svg = sundayCardSvg(card);
assert(svg.includes("12 из 14"), "picture shows protein days");
assert(svg.includes(">4<"), "picture shows the session count");
assert(!svg.includes("кг"), "picture has no kilograms");
assert(!svg.toLowerCase().includes("вес"), "picture has no scale");

const query = encodeSundayCard(card, secret);
assertEqual(decodeSundayCard(query, secret), card, "round trip");
assertEqual(decodeSundayCard(`${query}x`, secret), null, "bad signature");
assertEqual(decodeSundayCard(query, "other"), null, "other secret");

const shared = botInlineResults({
  query,
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: null,
  weekSecret: secret,
});
assertEqual(shared.length, 1, "one sunday photo");
const photo = shared[0];
assert(photo != null && photo.type === "photo", "photo result");
if (photo && photo.type === "photo") {
  assertEqual(photo.caption, caption, "chat caption is the safe card");
  assertEqual(
    photo.reply_markup?.inline_keyboard[0]?.[0],
    { text: BOT_INSTALL_DIARY, url: "https://t.me/yeahbuddybot" },
    "install button",
  );
  assert(!JSON.stringify(photo).includes("кг"), "shared payload has no kg");
}
assertEqual(
  botInlineResults({
    query,
    photoOrigin: "https://diary.example",
    installUrl: "https://t.me/yeahbuddybot",
    stickerFileId: null,
  }).length,
  0,
  "no secret, no card",
);

console.log("sunday card ok");
