import { PROTEIN_CLOSED_LABEL, YEAH_BUDDY_LINE } from "@/lib/flavor";
import { BOT_INSTALL_DIARY } from "@/lib/share/joy";
import {
  joyInlinePhotoResult,
  joyInlineResults,
  joyPhotoOrigin,
} from "@/lib/share/prepared";

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

console.log("prepared share ok");
