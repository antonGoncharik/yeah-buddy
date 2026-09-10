export async function shareOrCopyLink(
  url: string,
  text: string,
): Promise<"shared" | "copied"> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as {
      openTelegramLink?: (link: string) => void;
    };
    if (typeof webApp.openTelegramLink === "function") {
      const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      webApp.openTelegramLink(share);
      return "shared";
    }
  } catch {
    // outside Telegram, or old client
  }

  await navigator.clipboard.writeText(url);
  return "copied";
}

export function packShareText(kind: "meals" | "workouts"): string {
  return kind === "meals"
    ? "Еда на день из Yeah Buddy"
    : "Тренировки из Yeah Buddy";
}
