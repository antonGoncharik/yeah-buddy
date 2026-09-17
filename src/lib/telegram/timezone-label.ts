const FALLBACK_ZONE = "Europe/Moscow";

export function timezoneCaption(timeZone: string, now = new Date()): string {
  const zone = resolveCaptionZone(timeZone);
  try {
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    return `${zone.replaceAll("_", " ")} · сейчас ${time}`;
  } catch {
    return zone.replaceAll("_", " ");
  }
}

function resolveCaptionZone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) {
    return FALLBACK_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed }).format(new Date());
    return trimmed;
  } catch {
    return FALLBACK_ZONE;
  }
}
