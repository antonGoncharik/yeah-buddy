function decodeTelegramInitDataPayload(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

/** Drop direct-link hash keys that no longer match tgWebAppData (stale start_param poisons bot opens). */
export function scrubTelegramLaunchParams(
  params: Record<string, string>,
): Record<string, string> {
  const out = { ...params };
  const initData = decodeTelegramInitDataPayload(out.tgWebAppData ?? "");
  const search = new URLSearchParams(initData);
  const hasStart = Boolean(search.get("start_param")?.trim());
  const hasChat =
    Boolean(search.get("chat_type")?.trim()) ||
    Boolean(search.get("chat_instance")?.trim());

  if (!hasStart) {
    delete out.tgWebAppStartParam;
  }
  if (!hasStart && !hasChat) {
    delete out.tgWebAppFullscreen;
  }
  return out;
}

/** Boot script + Android early-fullscreen: direct-link fields inside stored tgWebAppData. */
export function storedLaunchParamsIndicateAppWebView(
  params: Record<string, string> | null | undefined,
): boolean {
  if (!params) {
    return false;
  }
  const scrubbed = scrubTelegramLaunchParams(params);
  const initData = decodeTelegramInitDataPayload(scrubbed.tgWebAppData ?? "");
  if (initData.includes("start_param=")) {
    return true;
  }
  if (
    initData.includes("chat_type=") ||
    initData.includes("chat_instance=")
  ) {
    return true;
  }
  const fullscreen = scrubbed.tgWebAppFullscreen;
  return fullscreen === "1" || fullscreen === "true";
}
