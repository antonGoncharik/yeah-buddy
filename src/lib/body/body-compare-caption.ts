export function readBodyCompareCaption(data: unknown): string | null {
  if (typeof data !== "object" || data == null || !("caption" in data)) {
    return null;
  }
  return typeof data.caption === "string" && data.caption !== ""
    ? data.caption
    : null;
}
