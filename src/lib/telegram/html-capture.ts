export const HTML_CAPTURE_DEAD_MS = 1_600;
export const HTML_CAPTURE_RETURN_MS = 800;

export type HtmlCaptureWatch = {
  elapsedMs: number;
  wasHidden: boolean;
  hiddenNow: boolean;
  visibleForMs: number;
  settled: "file" | "cancel" | null;
};

export function htmlCaptureOutcome(
  watch: HtmlCaptureWatch,
): "pending" | "file" | "cancel" | "dead" {
  if (watch.settled === "file") {
    return "file";
  }
  if (watch.settled === "cancel") {
    return "cancel";
  }
  if (watch.hiddenNow) {
    return "pending";
  }
  if (watch.wasHidden) {
    return watch.visibleForMs >= HTML_CAPTURE_RETURN_MS ? "cancel" : "pending";
  }
  if (watch.elapsedMs >= HTML_CAPTURE_DEAD_MS) {
    return "dead";
  }
  return "pending";
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function watchHtmlCapture(
  input: HTMLInputElement,
): Promise<File | "live" | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let wasHidden = document.visibilityState === "hidden";
    let visibleSince = wasHidden ? 0 : startedAt;
    let settled: "file" | "cancel" | null = null;
    let done = false;

    function finish(result: File | "live" | null) {
      if (done) {
        return;
      }
      done = true;
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(tick);
      if (result instanceof File) {
        input.value = "";
      }
      resolve(result);
    }

    function snapshot(): HtmlCaptureWatch {
      const now = Date.now();
      const hiddenNow = document.visibilityState === "hidden";
      return {
        elapsedMs: now - startedAt,
        wasHidden,
        hiddenNow,
        visibleForMs: hiddenNow || visibleSince === 0 ? 0 : now - visibleSince,
        settled,
      };
    }

    function check() {
      const outcome = htmlCaptureOutcome(snapshot());
      if (outcome === "file") {
        const file = input.files?.[0];
        finish(file ?? null);
        return;
      }
      if (outcome === "cancel") {
        finish(null);
        return;
      }
      if (outcome === "dead") {
        finish("live");
      }
    }

    function onChange() {
      settled = "file";
      check();
    }

    function onCancel() {
      settled = "cancel";
      check();
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        visibleSince = 0;
      } else if (visibleSince === 0) {
        visibleSince = Date.now();
      }
      check();
    }

    input.addEventListener("change", onChange);
    input.addEventListener("cancel", onCancel);
    document.addEventListener("visibilitychange", onVisibility);
    const tick = window.setInterval(check, 120);
    check();
  });
}
