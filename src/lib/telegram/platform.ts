export async function telegramPlatform(): Promise<string | null> {
  try {
    const sdk = await import("@twa-dev/sdk");
    const platform = (sdk.default as { platform?: string }).platform;
    return typeof platform === "string" ? platform : null;
  } catch {
    return null;
  }
}

export function preferLiveCamera(platform: string | null): boolean {
  return platform !== "android";
}

export async function openLiveStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: "environment" } },
  });
}
