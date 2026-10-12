import { readHistoryQuery } from "@/lib/api/respond";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const over = readHistoryQuery(
  new Request("https://app.test/api/days/history?limit=500"),
);
assert(over.ok === true, "parses high limit");
if (over.ok) {
  assert(over.limit === 120, "caps history at 120");
}

const ok = readHistoryQuery(
  new Request("https://app.test/api/days/history?limit=30"),
);
assert(ok.ok === true, "parses normal limit");
if (ok.ok) {
  assert(ok.limit === 30, "keeps limit under cap");
}

console.log("api respond ok");
