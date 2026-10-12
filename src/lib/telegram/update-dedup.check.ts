import {
  isDuplicateTelegramUpdate,
  rememberTelegramUpdate,
} from "@/lib/telegram/update-dedup";

const now = 1_000_000;
rememberTelegramUpdate(42, now);
if (!isDuplicateTelegramUpdate(42, now + 1)) {
  throw new Error("expected duplicate");
}
if (isDuplicateTelegramUpdate(99, now + 1)) {
  throw new Error("unexpected duplicate");
}
