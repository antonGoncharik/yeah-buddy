import {
  HTML_CAPTURE_DEAD_MS,
  HTML_CAPTURE_RETURN_MS,
  htmlCaptureOutcome,
} from "@/lib/telegram/html-capture";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(
  htmlCaptureOutcome({
    elapsedMs: 200,
    wasHidden: false,
    hiddenNow: false,
    visibleForMs: 200,
    settled: null,
  }),
  "pending",
  "wait for picker",
);

assertEqual(
  htmlCaptureOutcome({
    elapsedMs: HTML_CAPTURE_DEAD_MS,
    wasHidden: false,
    hiddenNow: false,
    visibleForMs: HTML_CAPTURE_DEAD_MS,
    settled: null,
  }),
  "dead",
  "html capture lied",
);

assertEqual(
  htmlCaptureOutcome({
    elapsedMs: 400,
    wasHidden: true,
    hiddenNow: true,
    visibleForMs: 0,
    settled: null,
  }),
  "pending",
  "native picker open",
);

assertEqual(
  htmlCaptureOutcome({
    elapsedMs: 2_000,
    wasHidden: true,
    hiddenNow: false,
    visibleForMs: HTML_CAPTURE_RETURN_MS,
    settled: null,
  }),
  "cancel",
  "returned without file",
);

assertEqual(
  htmlCaptureOutcome({
    elapsedMs: 80,
    wasHidden: false,
    hiddenNow: false,
    visibleForMs: 80,
    settled: "file",
  }),
  "file",
  "got file",
);

console.log("html capture ok");
