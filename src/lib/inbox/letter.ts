import {
  INBOX_TOPIC_CHANGE,
  INBOX_TOPIC_IMPROVE,
  INBOX_TOPIC_PROGRAM,
  inboxAsk,
} from "@/lib/messages";
import {
  type FeaturedProgramId,
  parseProgramStartPayload,
} from "@/lib/share/program-start";
import { isPackToken } from "@/lib/share/token";

export const INBOX_TOPICS = ["program", "improve", "change"] as const;

export type InboxTopic = (typeof INBOX_TOPICS)[number];

export const INBOX_START_MENU = "w";
export const INBOX_TEXT_LIMIT = 4096;
export const INBOX_DRAFT_LIMIT = 3500;

const TOPIC_LABEL: Record<InboxTopic, string> = {
  program: INBOX_TOPIC_PROGRAM,
  improve: INBOX_TOPIC_IMPROVE,
  change: INBOX_TOPIC_CHANGE,
};

export interface InboxThread {
  topic: InboxTopic | null;
  draft: string | null;
}

export const EMPTY_THREAD: InboxThread = { topic: null, draft: null };

export type StartKind =
  | { kind: "inbox"; topic: InboxTopic | "menu" }
  | { kind: "program"; id: FeaturedProgramId }
  | { kind: "pack"; token: string }
  | { kind: "plain" };

export function isInboxTopic(value: unknown): value is InboxTopic {
  return INBOX_TOPICS.some((topic) => topic === value);
}

export function inboxTopicLabel(topic: InboxTopic): string {
  return TOPIC_LABEL[topic];
}

export function inboxPrompt(topic: InboxTopic): string {
  return inboxAsk(inboxTopicLabel(topic));
}

export function isInboxAuthor(
  telegramId: number,
  inboxChatId: string | undefined,
): boolean {
  const adminId = readInboxChatId(inboxChatId);
  return adminId != null && adminId === telegramId;
}

export function readInboxChatId(raw: string | undefined): number | null {
  const trimmed = raw?.trim() ?? "";
  if (!/^\d{1,16}$/.test(trimmed)) {
    return null;
  }

  const id = Number(trimmed);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export function readTelegramId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/** Fresh each tap so Telegram re-sends /start even if the chat already exists. */
export function inboxMenuStartPayload(now = Date.now()): string {
  const stamp = Math.max(0, Math.floor(now)).toString();
  return `${INBOX_START_MENU}${stamp}`;
}

export function parseInboxStart(payload: string): InboxTopic | "menu" | null {
  // `w` or `w1739…` — menu. `w_program` stays a topic, not a stamped menu.
  if (payload === INBOX_START_MENU || /^w\d{1,20}$/.test(payload)) {
    return "menu";
  }

  if (!payload.startsWith("w_")) {
    return null;
  }

  const topic = payload.slice(2);
  return isInboxTopic(topic) ? topic : null;
}

export function parseInboxCallback(data: string): InboxTopic | "menu" | null {
  if (!data.startsWith("inbox:")) {
    return null;
  }

  const rest = data.slice("inbox:".length);
  if (rest === "menu") {
    return "menu";
  }

  return isInboxTopic(rest) ? rest : null;
}

/** Inbox before programs before packs: `w_program` is also a pack token. */
export function classifyStart(payload: string): StartKind {
  const inbox = parseInboxStart(payload);
  if (inbox) {
    return { kind: "inbox", topic: inbox };
  }

  const programId = parseProgramStartPayload(payload);
  if (programId) {
    return { kind: "program", id: programId };
  }

  if (isPackToken(payload)) {
    return { kind: "pack", token: payload };
  }

  return { kind: "plain" };
}

export function parseInboxUserId(text: string): number | null {
  const line = text.split("\n", 1)[0]?.trim() ?? "";
  const match = /^#u(\d{1,16})$/.exec(line);
  const digits = match?.[1];
  if (!digits) {
    return null;
  }

  return readTelegramId(digits);
}

export function inboxPersonLine(person: {
  username: string | null;
  firstName: string | null;
}): string {
  const handle = person.username ? `@${person.username}` : null;
  if (person.firstName && handle) {
    return `${person.firstName} · ${handle}`;
  }

  return person.firstName ?? handle ?? "без имени";
}

export function inboxAdminHeader(input: {
  telegramId: number;
  topic: InboxTopic;
  username: string | null;
  firstName: string | null;
}): string {
  return [
    `#u${input.telegramId}`,
    inboxTopicLabel(input.topic),
    inboxPersonLine(input),
  ].join("\n");
}

export function inboxAdminMessage(header: string, body: string): string {
  return fitInboxText(header, body, INBOX_TEXT_LIMIT);
}

export function clipInboxDraft(text: string): string {
  return clipInboxText(text.trim(), INBOX_DRAFT_LIMIT);
}

export function fitInboxText(
  header: string,
  body: string,
  limit: number,
): string {
  const trimmed = body.trim();
  if (trimmed === "") {
    return clipInboxText(header, limit);
  }

  const glue = "\n\n";
  const room = limit - header.length - glue.length;
  if (room < 1) {
    return clipInboxText(header, limit);
  }

  return `${header}${glue}${clipInboxText(trimmed, room)}`;
}

export function clipInboxText(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  const room = Math.max(0, limit - 1);
  return `${stripTailSurrogate(text.slice(0, room))}…`;
}

export function cleanInboxName(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[\r\n]+/g, " ").trim();
  if (cleaned === "") {
    return null;
  }

  return cleaned.slice(0, 64);
}

export function cleanInboxUsername(value: string | undefined): string | null {
  if (!value || !/^[A-Za-z0-9_]{1,32}$/.test(value)) {
    return null;
  }

  return value;
}

export function messageHasRelayMedia(message: {
  photo?: unknown;
  video?: unknown;
  voice?: unknown;
  video_note?: unknown;
  document?: unknown;
  animation?: unknown;
  sticker?: unknown;
  audio?: unknown;
}): boolean {
  return Boolean(
    message.photo ||
      message.video ||
      message.voice ||
      message.video_note ||
      message.document ||
      message.animation ||
      message.sticker ||
      message.audio,
  );
}

function stripTailSurrogate(value: string): string {
  if (value === "") {
    return value;
  }

  const last = value.charCodeAt(value.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) {
    return value.slice(0, -1);
  }

  return value;
}
