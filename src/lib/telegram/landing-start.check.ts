import {
  landingStartPayload,
  parseLandingStartPayload,
} from "@/lib/telegram/landing-start";

if (landingStartPayload("hero") !== "lp_hero") {
  throw new Error("landing payload");
}
if (landingStartPayload("!!!") !== "lp_cta") {
  throw new Error("landing payload sanitize");
}
if (parseLandingStartPayload("lp_hero")?.ref !== "lp_hero") {
  throw new Error("parse landing");
}
if (parseLandingStartPayload("coach_x") != null) {
  throw new Error("not landing");
}

console.log("landing start ok");
