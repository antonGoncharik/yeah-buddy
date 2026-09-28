import {
  HOME_SCREEN_API,
  HOME_SCREEN_TIP_BODY,
  homeScreenHint,
  isHomeScreenApiAvailable,
} from "@/lib/telegram/home-screen";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(HOME_SCREEN_API === "8.0", "home screen needs Bot API 8.0");

assert(
  !isHomeScreenApiAvailable({}),
  "empty webapp has no home screen api",
);
assert(
  isHomeScreenApiAvailable({
    addToHomeScreen: () => {},
    checkHomeScreenStatus: () => {},
    isVersionAtLeast: (version) => version === "8.0",
  }),
  "full api at 8.0",
);
assert(
  !isHomeScreenApiAvailable({
    addToHomeScreen: () => {},
    checkHomeScreenStatus: () => {},
    isVersionAtLeast: () => false,
  }),
  "old client blocks prompt",
);

assert(
  homeScreenHint("added").includes("уже"),
  "added hint is reassuring",
);
assert(
  homeScreenHint("missed").includes("главн"),
  "missed hint mentions home screen",
);
assert(
  HOME_SCREEN_TIP_BODY.includes("рабочий стол"),
  "tip explains the shortcut",
);

console.log("telegram home screen ok");
