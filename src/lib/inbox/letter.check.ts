import {
  classifyStart,
  cleanInboxName,
  cleanInboxUsername,
  clipInboxDraft,
  clipInboxText,
  fitInboxText,
  INBOX_DRAFT_LIMIT,
  inboxAdminHeader,
  inboxAdminMessage,
  inboxMenuStartPayload,
  inboxPersonLine,
  inboxPrompt,
  isInboxAuthor,
  messageHasRelayMedia,
  parseInboxCallback,
  parseInboxStart,
  parseInboxUserId,
  readInboxChatId,
} from "@/lib/inbox/letter";
import { readInboxOpenUrl } from "@/lib/inbox/open-url";
import { isPackToken } from "@/lib/share/token";

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

assertEqual(parseInboxStart("w"), "menu", "menu start");
assertEqual(parseInboxStart("w1734567890123"), "menu", "stamped menu start");
assertEqual(parseInboxStart("w_program"), "program", "program start");
assertEqual(parseInboxStart("w_improve"), "improve", "improve start");
assertEqual(parseInboxStart("w_change"), "change", "change start");
assertEqual(parseInboxStart("w_nope"), null, "unknown topic");
assertEqual(parseInboxStart("write"), null, "plain write is not inbox");
assertEqual(
  parseInboxStart("w_123"),
  null,
  "underscore digits are not a menu stamp",
);
assert(isPackToken("w_program"), "topic start looks like a pack");
assertEqual(
  classifyStart("w1734567890123"),
  { kind: "inbox", topic: "menu" },
  "stamped menu wins over pack shape",
);
assertEqual(
  classifyStart("w_program"),
  { kind: "inbox", topic: "program" },
  "inbox wins over pack",
);
assertEqual(
  classifyStart("p_full_body"),
  { kind: "program", id: "full_body" },
  "program before pack",
);
assertEqual(
  classifyStart("abcdEF12_xyz"),
  { kind: "pack", token: "abcdEF12_xyz" },
  "pack still works",
);
assertEqual(classifyStart(""), { kind: "plain" }, "empty start");

assertEqual(
  inboxMenuStartPayload(1734567890123),
  "w1734567890123",
  "menu stamp",
);
assert(/^w\d+$/.test(inboxMenuStartPayload()), "live menu stamp");

assertEqual(parseInboxCallback("inbox:menu"), "menu", "menu callback");
assertEqual(parseInboxCallback("inbox:change"), "change", "change callback");
assertEqual(parseInboxCallback("inbox:"), null, "empty callback");
assertEqual(parseInboxCallback("nope"), null, "foreign callback");

assertEqual(readInboxChatId("123456"), 123456, "chat id");
assertEqual(readInboxChatId(" 42 "), 42, "trimmed chat id");
assertEqual(readInboxChatId("0"), null, "zero chat");
assertEqual(readInboxChatId("12a"), null, "junk chat");
assertEqual(readInboxChatId(undefined), null, "missing chat");

assertEqual(
  parseInboxUserId("#u99\nСвоя программа\n\nпривет"),
  99,
  "marker is the first line",
);
assertEqual(
  parseInboxUserId("привет\n#u99"),
  null,
  "marker in the body is ignored",
);
assertEqual(parseInboxUserId("#u0"), null, "zero user");
assertEqual(parseInboxUserId("#u"), null, "bare marker");

assertEqual(
  inboxPersonLine({ firstName: "Антон", username: "yeah" }),
  "Антон · @yeah",
  "name and handle",
);
assertEqual(
  inboxPersonLine({ firstName: null, username: null }),
  "без имени",
  "nameless",
);
assertEqual(cleanInboxName("А\nн"), "А н", "name on one line");
assertEqual(cleanInboxName("   "), null, "blank name");
assertEqual(cleanInboxUsername("yeah_buddy"), "yeah_buddy", "username");
assertEqual(cleanInboxUsername("bad name"), null, "username with space");

const header = inboxAdminHeader({
  telegramId: 7,
  topic: "program",
  username: "yeah",
  firstName: "Антон",
});
assert(header.startsWith("#u7\n"), "header marker");
assert(
  inboxAdminMessage(header, "нужна своя").includes("нужна своя"),
  "body follows header",
);
assertEqual(
  parseInboxUserId(inboxAdminMessage(header, "#u1\nчужое")),
  7,
  "body cannot replace the marker",
);

assertEqual(fitInboxText("шапка", "", 20), "шапка", "empty body is the header");
assertEqual(
  fitInboxText("шапка", "текст", 6),
  "шапка",
  "header wins when the body does not fit",
);
assertEqual(clipInboxText("abcdef", 4), "abc…", "clip leaves an ellipsis");
assertEqual(clipInboxText("абвгд", 4), "абв…", "clip counts utf-16 units");
assert(
  clipInboxDraft("я".repeat(INBOX_DRAFT_LIMIT + 10)).length ===
    INBOX_DRAFT_LIMIT,
  "draft cap",
);
assertEqual(clipInboxText("🙂x", 2), "…", "clip drops a lone surrogate");

assertEqual(
  inboxPrompt("improve"),
  "Что улучшить. Напиши сюда — ответ придёт в этот чат.",
  "ask names the topic",
);

assert(messageHasRelayMedia({ photo: [{}] }), "photo relays");
assert(!messageHasRelayMedia({}), "plain text is not media");

assertEqual(
  readInboxOpenUrl({ url: "https://t.me/yeahbuddy?start=w" }),
  "https://t.me/yeahbuddy?start=w",
  "open url",
);
assertEqual(isInboxAuthor(7, "7"), true, "author is the inbox chat");
assertEqual(isInboxAuthor(8, "7"), false, "someone else can write and pay");
assertEqual(isInboxAuthor(7, undefined), false, "no inbox means no author");
assertEqual(isInboxAuthor(7, "0"), false, "bad inbox id is not an author");

assertEqual(readInboxOpenUrl({ url: null }), null, "hidden inbox");
assertEqual(
  readInboxOpenUrl({ url: "https://example.com" }),
  null,
  "not a telegram url",
);

console.log("inbox letter ok");
