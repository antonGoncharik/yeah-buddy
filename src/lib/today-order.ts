export const TODAY_ORDER_COOKIE = "yeah-buddy-today-order";

export type TodayOrder = "meals" | "numbers";

export function parseTodayOrder(value: string | undefined | null): TodayOrder {
  return value === "meals" ? "meals" : "numbers";
}

export function persistTodayOrder(order: TodayOrder) {
  // biome-ignore lint/suspicious/noDocumentCookie: SSR reads this cookie on the next request.
  document.cookie = `${TODAY_ORDER_COOKIE}=${order}; path=/; max-age=31536000; samesite=lax`;
}
