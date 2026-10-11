import {
  CLIENT_PRODUCT_EVENTS,
  isClientProductEvent,
  isProductEvent,
  PRODUCT_EVENTS,
} from "@/lib/analytics/events";
import { sanitizeProductProps } from "@/lib/analytics/props";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(PRODUCT_EVENTS.length >= 16, "product event allowlist");
assert(isProductEvent("food_logged"), "food_logged");
assert(isProductEvent("onboarding_step_view"), "onboarding client");
assert(!isProductEvent("telegram_id"), "no telegram event name");
assert(isClientProductEvent("energy_offer_shown"), "energy client");
assert(!isClientProductEvent("pack_apply"), "pack server only");
assert(CLIENT_PRODUCT_EVENTS.length === 3, "three client events");

const safe = sanitizeProductProps({
  method: "plate",
  ok: true,
  telegram_id: 1,
  weight: 80,
  food_name: "овсянка",
});
assert(safe.method === "plate", "method kept");
assert(safe.ok === true, "ok kept");
assert(!("telegram_id" in safe), "telegram stripped");
assert(!("weight" in safe), "weight stripped");
assert(!("food_name" in safe), "food stripped");

console.log("product events ok");
