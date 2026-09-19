import { programStartPayload } from "@/lib/share/program-start";
import {
  isIncomingStartPayload,
  pickStartPayload,
  startPayloadFromLocation,
} from "@/lib/share/start-param";
import { createPackToken } from "@/lib/share/token";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const pack = createPackToken();
assert(isIncomingStartPayload(pack), "pack is a start payload");
assert(isIncomingStartPayload("p_full_body"), "program is a start payload");
assert(isIncomingStartPayload("p_ppl"), "short program is a start payload");
assert(!isIncomingStartPayload("ppl"), "bare ppl is not a start");
assert(!isIncomingStartPayload("open"), "junk is not a start");

assertEqual(
  pickStartPayload(["open", "p_full_body", pack]),
  "p_full_body",
  "program wins over later pack",
);
assertEqual(pickStartPayload(["", "nope", pack]), pack, "pack still works");

assertEqual(
  startPayloadFromLocation({
    telegramStartParam: "p_ppl",
    search: "",
    hash: "",
  }),
  programStartPayload("ppl"),
  "telegram start_param",
);
assertEqual(
  startPayloadFromLocation({
    search: `?startapp=${programStartPayload("five_three_one")}`,
    hash: "",
  }),
  "p_five_three_one",
  "startapp query",
);
assertEqual(
  startPayloadFromLocation({
    search: "",
    hash: `#tgWebAppStartParam=${pack}`,
  }),
  pack,
  "hashed mini app param",
);
assertEqual(
  startPayloadFromLocation({ search: "?startapp=open", hash: "" }),
  null,
  "generic startapp is not a product",
);

console.log("start param ok");
