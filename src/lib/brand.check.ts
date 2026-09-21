import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from "@/lib/brand";

function assert(condition: unknown, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(APP_TITLE.startsWith(APP_NAME), "public title starts with the name");
assert(APP_TITLE.length <= 60, "public title fits a search result");
assert(
  APP_DESCRIPTION.length >= 80 && APP_DESCRIPTION.length <= 170,
  `public description length, got ${APP_DESCRIPTION.length}`,
);
assert(APP_DESCRIPTION.includes("Telegram"), "description names Telegram");
assert(
  APP_DESCRIPTION.includes("Без регистрации"),
  "description says there is no signup",
);

console.log("brand ok");
