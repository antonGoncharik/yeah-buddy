import { parseBarcodeEan } from "@/lib/food/catalog-map";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

const DETECTOR_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "code_128",
];

export function readScannedBarcode(raw: string): string | null {
  return parseBarcodeEan(raw.replace(/\s+/g, ""));
}

export async function watchVideoBarcode(
  video: HTMLVideoElement,
  stream: MediaStream,
  signal: AbortSignal,
): Promise<string> {
  if (barcodeDetectorCtor()) {
    try {
      return await watchWithDetector(video, signal);
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
    }
  }

  return watchWithZxing(video, stream, signal);
}

function barcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

function watchWithDetector(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<string> {
  const Detector = barcodeDetectorCtor();
  if (!Detector) {
    return Promise.reject(new Error("detector"));
  }

  let detector: BarcodeDetectorInstance;
  try {
    detector = new Detector({ formats: DETECTOR_FORMATS });
  } catch {
    detector = new Detector();
  }

  return new Promise((resolve, reject) => {
    let frame = 0;

    function stop() {
      cancelAnimationFrame(frame);
      signal.removeEventListener("abort", onAbort);
    }

    function onAbort() {
      stop();
      reject(
        signal.reason instanceof Error ? signal.reason : new Error("abort"),
      );
    }

    signal.addEventListener("abort", onAbort);

    const tick = () => {
      if (signal.aborted) {
        return;
      }

      void detector
        .detect(video)
        .then((codes) => {
          if (signal.aborted) {
            return;
          }
          for (const code of codes) {
            const ean = readScannedBarcode(code.rawValue);
            if (ean) {
              stop();
              resolve(ean);
              return;
            }
          }
          frame = requestAnimationFrame(tick);
        })
        .catch(() => {
          if (!signal.aborted) {
            frame = requestAnimationFrame(tick);
          }
        });
    };

    frame = requestAnimationFrame(tick);
  });
}

async function watchWithZxing(
  video: HTMLVideoElement,
  stream: MediaStream,
  signal: AbortSignal,
): Promise<string> {
  const { BrowserMultiFormatOneDReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatOneDReader();

  return new Promise((resolve, reject) => {
    let controls: { stop: () => void } | null = null;
    let settled = false;

    function finish(ok: string | null, error?: Error) {
      if (settled) {
        return;
      }
      settled = true;
      signal.removeEventListener("abort", onAbort);
      controls?.stop();
      if (ok) {
        resolve(ok);
        return;
      }
      reject(error ?? new Error("scan"));
    }

    function onAbort() {
      finish(
        null,
        signal.reason instanceof Error ? signal.reason : new Error("abort"),
      );
    }

    signal.addEventListener("abort", onAbort);

    void reader
      .decodeFromStream(stream, video, (result) => {
        const ean = result ? readScannedBarcode(result.getText()) : null;
        if (ean) {
          finish(ean);
        }
      })
      .then((next) => {
        controls = next;
        if (signal.aborted) {
          onAbort();
        }
      })
      .catch((error: unknown) => {
        finish(null, error instanceof Error ? error : new Error("scan"));
      });
  });
}
