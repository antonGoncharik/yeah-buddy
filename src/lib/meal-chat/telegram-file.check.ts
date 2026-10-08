import assert from "node:assert/strict";

import { audioMimeFromTelegram } from "@/lib/meal-chat/telegram-file";

assert.equal(
  audioMimeFromTelegram("voice/file.oga", "audio/ogg"),
  "audio/ogg",
  "declared ogg",
);
assert.equal(
  audioMimeFromTelegram("voice/file.oga"),
  "audio/ogg",
  "oga path",
);
assert.equal(
  audioMimeFromTelegram("voice/file.bin", "audio/mpeg"),
  "audio/mp3",
  "mpeg alias",
);

console.log("meal chat telegram file ok");
