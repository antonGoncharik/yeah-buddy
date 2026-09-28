import {
  isShareToStoryAvailable,
  SHARE_STORY_API,
} from "@/lib/telegram/share-story";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(SHARE_STORY_API === "7.8", "story api version");
assert(!isShareToStoryAvailable({}), "no method");
assert(
  isShareToStoryAvailable({
    shareToStory: () => {},
    isVersionAtLeast: (version) => version === "7.8",
  }),
  "story at 7.8",
);

console.log("telegram share story ok");
