export type ViewportInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type TelegramViewportSource = {
  ready?: () => void;
  viewportStableHeight?: number;
  safeAreaInset?: ViewportInset;
  contentSafeAreaInset?: ViewportInset;
  onEvent: (event: string, callback: () => void) => void;
  offEvent: (event: string, callback: () => void) => void;
};

export type ViewportSizes = {
  layoutHeight: number;
  visualBottom?: number;
  visualHeight?: number;
  baselineHeight?: number;
};

const SIDES = ["top", "bottom", "left", "right"] as const;
const EVENTS = [
  "viewportChanged",
  "safeAreaChanged",
  "contentSafeAreaChanged",
  "fullscreenChanged",
  "fullscreenFailed",
] as const;
const RETRY_MS = [50, 250, 800];
const HOME_INDICATOR_MIN = 16;
const HOME_INDICATOR_MAX = 56;

export function extraBottomGap(
  layoutHeight: number,
  visualBottom: number,
): number {
  const gap = layoutHeight - visualBottom;
  if (
    !Number.isFinite(gap) ||
    gap < HOME_INDICATOR_MIN ||
    gap > HOME_INDICATOR_MAX
  ) {
    return 0;
  }
  return Math.round(gap);
}

export function chromeBottomShift(
  layoutHeight: number,
  stableHeight: number,
): number {
  if (
    !Number.isFinite(layoutHeight) ||
    !Number.isFinite(stableHeight) ||
    stableHeight <= 0
  ) {
    return 0;
  }
  return Math.max(0, Math.round(layoutHeight - stableHeight));
}

export function keyboardOverlayInset(
  layoutHeight: number,
  visualBottom: number,
): number {
  const gap = layoutHeight - visualBottom;
  if (!Number.isFinite(gap) || gap <= HOME_INDICATOR_MAX) {
    return 0;
  }
  return Math.round(gap);
}

export function isKeyboardOpen(
  visualHeight: number,
  options: { stableHeight?: number; baselineHeight?: number } = {},
): boolean {
  const { stableHeight, baselineHeight } = options;
  const baseline = pickBaseline(stableHeight, baselineHeight);
  if (baseline == null || !Number.isFinite(visualHeight)) {
    return false;
  }
  return baseline - visualHeight > HOME_INDICATOR_MAX;
}

function pickBaseline(
  stableHeight: number | undefined,
  baselineHeight: number | undefined,
): number | null {
  if (
    typeof stableHeight === "number" &&
    Number.isFinite(stableHeight) &&
    stableHeight > 0
  ) {
    return stableHeight;
  }
  if (
    typeof baselineHeight === "number" &&
    Number.isFinite(baselineHeight) &&
    baselineHeight > 0
  ) {
    return baselineHeight;
  }
  return null;
}

function asPx(value: number): string {
  return `${Math.max(0, Math.round(value))}px`;
}

function readInset(
  inset: ViewportInset | undefined,
  side: (typeof SIDES)[number],
): number {
  const value = inset?.[side];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

export function syncTelegramViewport(
  webApp: TelegramViewportSource,
  root: HTMLElement,
  sizes: ViewportSizes,
): void {
  const { layoutHeight, visualBottom, visualHeight, baselineHeight } = sizes;
  const style = root.style;
  const stable = webApp.viewportStableHeight;
  const chrome =
    typeof stable === "number" && Number.isFinite(stable) && stable > 0
      ? chromeBottomShift(layoutHeight, stable)
      : 0;

  if (typeof stable === "number" && Number.isFinite(stable) && stable > 0) {
    style.setProperty("--tg-viewport-stable-height", asPx(stable));
    style.setProperty("--app-chrome-bottom", asPx(chrome));
  }

  const extra =
    visualBottom === undefined ? 0 : extraBottomGap(layoutHeight, visualBottom);

  if (webApp.safeAreaInset) {
    for (const side of SIDES) {
      const safe = readInset(webApp.safeAreaInset, side);
      const fallback = side === "bottom" ? extra : 0;
      style.setProperty(
        `--tg-safe-area-inset-${side}`,
        asPx(Math.max(safe, fallback)),
      );
    }
  } else if (extra > 0) {
    style.setProperty("--tg-safe-area-inset-bottom", asPx(extra));
  }

  if (webApp.contentSafeAreaInset) {
    for (const side of SIDES) {
      style.setProperty(
        `--tg-content-safe-area-inset-${side}`,
        asPx(readInset(webApp.contentSafeAreaInset, side)),
      );
    }
  }

  const overlay =
    visualBottom === undefined
      ? 0
      : keyboardOverlayInset(layoutHeight, visualBottom);
  const open =
    typeof visualHeight === "number" &&
    isKeyboardOpen(visualHeight, {
      stableHeight: typeof stable === "number" ? stable : undefined,
      baselineHeight,
    });

  if (open) {
    root.dataset.keyboard = "open";
    style.setProperty("--app-fixed-bottom", asPx(overlay));
  } else {
    delete root.dataset.keyboard;
    style.removeProperty("--app-fixed-bottom");
  }
}

function currentSizes(): ViewportSizes {
  const viewport = window.visualViewport;
  return {
    layoutHeight: window.innerHeight,
    visualBottom: viewport ? viewport.height + viewport.offsetTop : undefined,
    visualHeight: viewport?.height,
  };
}

export function bindTelegramViewport(
  webApp: TelegramViewportSource,
): () => void {
  webApp.ready?.();

  let baselineHeight = 0;

  const sync = () => {
    const sizes = currentSizes();
    if (
      typeof sizes.visualHeight === "number" &&
      sizes.visualHeight > baselineHeight
    ) {
      baselineHeight = sizes.visualHeight;
    }
    syncTelegramViewport(webApp, document.documentElement, {
      ...sizes,
      baselineHeight,
    });
  };

  const onOrientation = () => {
    baselineHeight = 0;
    sync();
  };

  sync();
  for (const event of EVENTS) {
    webApp.onEvent(event, sync);
  }

  const timeouts = RETRY_MS.map((ms) => window.setTimeout(sync, ms));
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", sync);
  viewport?.addEventListener("scroll", sync);
  window.addEventListener("resize", sync);
  window.addEventListener("orientationchange", onOrientation);

  return () => {
    for (const event of EVENTS) {
      webApp.offEvent(event, sync);
    }
    for (const id of timeouts) {
      window.clearTimeout(id);
    }
    viewport?.removeEventListener("resize", sync);
    viewport?.removeEventListener("scroll", sync);
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", onOrientation);
  };
}
