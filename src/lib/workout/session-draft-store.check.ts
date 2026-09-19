import { overlaySessionDrafts } from "@/lib/workout/session-draft-store";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const planned = {
  "set-1": { weight: "80", reps: "5", seconds: "", rir: "" },
  "set-2": { weight: "80", reps: "5", seconds: "", rir: "" },
};

assertEqual(
  overlaySessionDrafts(planned, {
    "set-1": { weight: "82.5", reps: "4", seconds: "", rir: "1" },
    gone: { weight: "1", reps: "1", seconds: "", rir: "" },
  }),
  {
    "set-1": { weight: "82.5", reps: "4", seconds: "", rir: "1" },
    "set-2": { weight: "80", reps: "5", seconds: "", rir: "" },
  },
  "keeps typed sets, drops stale ids",
);

assertEqual(overlaySessionDrafts(planned, null), planned, "no stored draft");

console.log("session draft store ok");
