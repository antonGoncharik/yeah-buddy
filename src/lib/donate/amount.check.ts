import {
  DONATE_DESCRIPTION,
  DONATE_MAX,
  DONATE_PRESETS,
  donateCheckoutOk,
  donateConfirmMessage,
  donateInvoicePayload,
  donateNeedsConfirm,
  donateStarsLabel,
  isDonateInvoiceUrl,
  parseDonatePayload,
  parseDonateStars,
} from "@/lib/donate/amount";
import { DONATE_THANKS } from "@/lib/messages";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(parseDonateStars(""), null, "empty");
assertEqual(parseDonateStars("   "), null, "blank");
assertEqual(parseDonateStars("0"), null, "zero");
assertEqual(parseDonateStars("00"), null, "double zero");
assertEqual(parseDonateStars("-1"), null, "negative");
assertEqual(parseDonateStars("1.5"), null, "decimal");
assertEqual(parseDonateStars("1e2"), null, "exponent");
assertEqual(parseDonateStars(" 250 "), 250, "trimmed preset");
assertEqual(parseDonateStars("1000"), 1000, "confirm edge");
assertEqual(parseDonateStars("1001"), 1001, "above confirm");
assertEqual(parseDonateStars(String(DONATE_MAX)), DONATE_MAX, "max");
assertEqual(parseDonateStars(String(DONATE_MAX + 1)), null, "above max");
assertEqual(parseDonateStars("9".repeat(20)), null, "overflow");

for (const preset of DONATE_PRESETS) {
  assertEqual(parseDonateStars(String(preset)), preset, `preset ${preset}`);
  assertEqual(donateNeedsConfirm(preset), false, `preset confirm ${preset}`);
}

assertEqual(donateNeedsConfirm(1000), false, "1000 skips confirm");
assertEqual(donateNeedsConfirm(1001), true, "1001 confirms");
assertEqual(donateStarsLabel(50), "50\u00a0★", "preset label");
assertEqual(donateConfirmMessage(1500), "1500\u00a0★", "confirm shows stars");
assertEqual(
  DONATE_DESCRIPTION,
  "Звёзды Telegram. Уходят автору на протеин💪",
  "description names stars",
);
assertEqual(DONATE_THANKS, "Спасибо", "thanks");

assertEqual(parseDonatePayload("donate:50"), 50, "payload");
assertEqual(parseDonatePayload("donate:0"), null, "payload zero");
assertEqual(parseDonatePayload("donate:"), null, "payload empty");
assertEqual(parseDonatePayload("other:50"), null, "payload other");
assertEqual(donateInvoicePayload(250), "donate:250", "payload build");

assertEqual(
  donateCheckoutOk({
    currency: "XTR",
    totalAmount: 250,
    payload: "donate:250",
  }),
  true,
  "checkout stars",
);
assertEqual(
  donateCheckoutOk({
    currency: "USD",
    totalAmount: 250,
    payload: "donate:250",
  }),
  false,
  "checkout currency",
);
assertEqual(
  donateCheckoutOk({
    currency: "XTR",
    totalAmount: 50,
    payload: "donate:250",
  }),
  false,
  "checkout mismatch",
);
assertEqual(
  donateCheckoutOk({
    currency: "XTR",
    totalAmount: 0,
    payload: "donate:0",
  }),
  false,
  "checkout zero",
);

assertEqual(isDonateInvoiceUrl("https://t.me/$abc"), true, "invoice url");
assertEqual(isDonateInvoiceUrl("http://t.me/$abc"), false, "invoice http");
assertEqual(isDonateInvoiceUrl("https://example.com"), false, "invoice other");
