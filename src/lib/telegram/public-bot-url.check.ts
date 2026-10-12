import { landingCtaPath } from "@/lib/telegram/public-bot-url";

if (landingCtaPath("hero") !== "/go?src=hero") {
  throw new Error("landing cta path");
}

console.log("public bot url ok");
