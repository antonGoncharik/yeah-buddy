import { PROTEIN_CLOSED_LABEL, YEAH_BUDDY_LINE } from "@/lib/flavor";
import { BOT_PROGRAM_START } from "@/lib/messages";
import { dayShareCard } from "@/lib/share/day";
import { BOT_INSTALL_DIARY } from "@/lib/share/joy";
import {
  botInlineResults,
  joyInlinePhotoResult,
  joyInlineResults,
  joyPhotoOrigin,
} from "@/lib/share/prepared";
import { programStartPayload } from "@/lib/share/program-start";

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

const result = joyInlinePhotoResult({
  id: "joy-session",
  line: YEAH_BUDDY_LINE,
  doodle: "trex",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
});

assertEqual(result.type, "photo", "photo not a url card");
assertEqual(result.caption, YEAH_BUDDY_LINE, "one line caption");
assertEqual(
  result.photo_url,
  "https://diary.example/share/trex.jpg",
  "doodle is a hosted jpeg",
);
assertEqual("url" in result, false, "no article url for Telegram preview");
assertEqual(
  result.reply_markup?.inline_keyboard[0]?.[0],
  { text: BOT_INSTALL_DIARY, url: "https://t.me/yeahbuddybot" },
  "install opens the bot",
);
assert(!JSON.stringify(result).includes("t.me/share/url"), "not share/url");
assertEqual(
  joyPhotoOrigin("https://diary.example"),
  "https://diary.example",
  "https origin",
);
assertEqual(
  joyPhotoOrigin("http://localhost:3000"),
  null,
  "http is dead for Telegram",
);
assertEqual(
  joyPhotoOrigin("https://t.me/yeahbuddybot"),
  null,
  "bot chat is not photo host",
);

const organic = joyInlineResults({
  query: "",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
assertEqual(organic[0]?.type, "sticker", "empty query offers the trex sticker");
assertEqual(organic[1]?.type, "photo", "yeah buddy photo follows the sticker");
assertEqual(
  organic[1] && "caption" in organic[1] ? organic[1].caption : null,
  YEAH_BUDDY_LINE,
  "organic photo is yeah buddy",
);

const prepared = joyInlineResults({
  query: "joy protein",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
assertEqual(prepared.length, 1, "joy query is the photo, not the sticker");
assertEqual(
  prepared[0] && "caption" in prepared[0] ? prepared[0].caption : null,
  PROTEIN_CLOSED_LABEL,
  "protein caption",
);

const storefront = botInlineResults({
  query: "",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
assertEqual(storefront[0]?.type, "article", "empty query leads with a program");
assertEqual(
  storefront[0] && "title" in storefront[0] ? storefront[0].title : null,
  "Всё тело",
  "first card is full body",
);
assertEqual(
  storefront[3]?.type,
  "sticker",
  "sticker still follows the programs",
);
assert(
  JSON.stringify(storefront[0]).includes(
    `start=${programStartPayload("full_body")}`,
  ),
  "program button is a bot start link",
);
assertEqual(
  storefront[0] && "reply_markup" in storefront[0]
    ? storefront[0].reply_markup?.inline_keyboard[0]?.[0]?.text
    : null,
  BOT_PROGRAM_START,
  "program button says put it on",
);

const searched = botInlineResults({
  query: "5x5",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
assertEqual(searched.length, 1, "5x5 is only 5×5");
assertEqual(
  searched[0] && "title" in searched[0] ? searched[0].title : null,
  "5×5 A/B",
  "5x5 title",
);

const joyQuery = botInlineResults({
  query: "joy protein",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
assertEqual(joyQuery.length, 1, "joy query stays joy-only");
assertEqual(
  joyQuery[0] && "caption" in joyQuery[0] ? joyQuery[0].caption : null,
  PROTEIN_CLOSED_LABEL,
  "joy protein is not a program",
);

const dayQuery = botInlineResults({
  query: "day 142 2100 gym cookie",
  photoOrigin: "https://diary.example",
  installUrl: "https://t.me/yeahbuddybot",
  stickerFileId: "sticker-file",
});
const dayCard = dayShareCard({ protein: 142, kcal: 2100, gym: "gym" });
assertEqual(dayQuery.length, 1, "day query is the day card");
assertEqual(
  dayQuery[0] && "caption" in dayQuery[0] ? dayQuery[0].caption : null,
  dayCard,
  "day caption is protein kcal gym",
);
assertEqual(
  dayQuery[0] && "title" in dayQuery[0] ? dayQuery[0].title : null,
  dayCard.replaceAll("\n", " · "),
  "day title is one line",
);
assertEqual(
  dayQuery[0] && "photo_url" in dayQuery[0] ? dayQuery[0].photo_url : null,
  "https://diary.example/share/cookie.jpg",
  "closed protein keeps the cookie",
);
assert(!JSON.stringify(dayQuery[0]).includes("вес"), "day card has no weight");

console.log("prepared share ok");
