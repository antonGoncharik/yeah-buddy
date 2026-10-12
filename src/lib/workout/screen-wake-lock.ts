export async function acquireScreenWakeLock(): Promise<{
  release: () => Promise<void>;
} | null> {
  if (typeof navigator === "undefined" || !navigator.wakeLock) {
    return null;
  }
  try {
    const sentinel = await navigator.wakeLock.request("screen");
    return {
      release: async () => {
        try {
          await sentinel.release();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    return null;
  }
}
