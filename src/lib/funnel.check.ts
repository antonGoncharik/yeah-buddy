import { FUNNEL_EVENTS, isFunnelEvent } from "@/lib/funnel/events";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(FUNNEL_EVENTS.length === 5, "five funnel steps");
assert(isFunnelEvent("onboarding_done"), "setup");
assert(isFunnelEvent("first_food"), "food");
assert(isFunnelEvent("first_session"), "gym");
assert(isFunnelEvent("share"), "share");
assert(isFunnelEvent("program_start"), "bot program");
assert(!isFunnelEvent("protein"), "no food facts");
assert(!isFunnelEvent("telegram_id"), "no telegram");

console.log("funnel events ok");
