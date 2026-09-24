export const DIARY_DENSITY_COOKIE = "yeah-buddy-density";

export type DiaryDensity = "compact" | "expanded";

export function parseDiaryDensity(
  value: string | undefined | null,
): DiaryDensity {
  return value === "compact" ? "compact" : "expanded";
}

export function persistDiaryDensity(density: DiaryDensity) {
  // biome-ignore lint/suspicious/noDocumentCookie: SSR reads this cookie on the next request.
  document.cookie = `${DIARY_DENSITY_COOKIE}=${density}; path=/; max-age=31536000; samesite=lax`;
}
