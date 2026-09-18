import { parseSharePackSummary, readSharePacksPayload } from "@/lib/share/map";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const live = parseSharePackSummary({
  id: "1",
  token: "abcdefghijkl",
  kind: "meals",
  title: "Еда",
  hint: "2 дня",
  created_at: "2026-01-01",
  revoked: false,
  mine: true,
  received: false,
  share_url: "https://t.me/bot",
});

assert(live?.mine === true, "own pack is mine");
assert(live?.received === false, "own pack is not received");
assert(live?.revoked === false, "own pack is live");

const received = parseSharePackSummary({
  token: "mnopqrstuvwx",
  kind: "workouts",
  title: "Зал",
  mine: true,
  received: true,
});

assert(received?.received === true, "saved pack is received");
assert(received?.share_url === null, "missing share url");

const packs = readSharePacksPayload({
  packs: [
    {
      token: "abcdefghijkl",
      kind: "meals",
      title: "Еда",
      mine: true,
    },
    {
      token: "mnopqrstuvwx",
      kind: "workouts",
      title: "Выключена",
      mine: true,
      revoked: true,
    },
  ],
});

assert(packs.length === 1, "revoked packs stay out of the list");
assert(packs[0]?.token === "abcdefghijkl", "live pack remains");
assert(packs[0]?.received === false, "missing received is false");

console.log("share pack map ok");
