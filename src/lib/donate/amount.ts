import { DONATE_HINT } from "@/lib/messages";

export const DONATE_PRESETS = [50, 100, 250] as const;
export const DONATE_MIN = 1;
export const DONATE_MAX = 10_000;
export const DONATE_CONFIRM_ABOVE = 1000;
export const DONATE_CURRENCY = "XTR";
export const DONATE_TITLE = "Автору";
export const DONATE_DESCRIPTION = DONATE_HINT;
export const DONATE_PRICE_LABEL = "Звёзды";

const PAYLOAD_PREFIX = "donate:";

export function parseDonateStars(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }

  const value = Number(text);
  if (!Number.isSafeInteger(value)) {
    return null;
  }
  if (value < DONATE_MIN || value > DONATE_MAX) {
    return null;
  }

  return value;
}

export function donateNeedsConfirm(stars: number): boolean {
  return stars > DONATE_CONFIRM_ABOVE;
}

export function donateStarsLabel(stars: number): string {
  return `${stars}\u00a0★`;
}

export function donateConfirmMessage(stars: number): string {
  return donateStarsLabel(stars);
}

export function donateInvoicePayload(stars: number): string {
  return `${PAYLOAD_PREFIX}${stars}`;
}

export function parseDonatePayload(payload: string): number | null {
  if (!payload.startsWith(PAYLOAD_PREFIX)) {
    return null;
  }
  return parseDonateStars(payload.slice(PAYLOAD_PREFIX.length));
}

export function donateCheckoutOk(input: {
  currency: string;
  totalAmount: number;
  payload: string;
}): boolean {
  const stars = parseDonatePayload(input.payload);
  return (
    stars != null &&
    input.currency === DONATE_CURRENCY &&
    input.totalAmount === stars
  );
}

export function isDonateInvoiceUrl(url: string): boolean {
  return url.startsWith("https://t.me/");
}
