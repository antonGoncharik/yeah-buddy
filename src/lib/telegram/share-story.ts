export const SHARE_STORY_API = "7.8";

type StoryWidgetLink = {
  url: string;
  name: string;
};

type StoryShareParams = {
  text?: string;
  widget_link?: StoryWidgetLink;
};

type StoryHost = {
  isVersionAtLeast?: (version: string) => boolean;
  shareToStory?: (mediaUrl: string, params?: StoryShareParams) => void;
};

export function isShareToStoryAvailable(webApp: StoryHost): boolean {
  if (typeof webApp.shareToStory !== "function") {
    return false;
  }
  if (typeof webApp.isVersionAtLeast === "function") {
    return webApp.isVersionAtLeast(SHARE_STORY_API);
  }
  return true;
}

export async function sharePhotoToStory(
  photoUrl: string,
  params?: StoryShareParams,
): Promise<"opened" | "unavailable"> {
  if (!photoUrl.startsWith("https://")) {
    return "unavailable";
  }

  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as StoryHost;
    if (!isShareToStoryAvailable(webApp)) {
      return "unavailable";
    }

    webApp.shareToStory?.(photoUrl, params);
    return "opened";
  } catch {
    return "unavailable";
  }
}
