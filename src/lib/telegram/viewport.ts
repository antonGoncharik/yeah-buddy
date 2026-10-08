export type ViewportInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type TelegramViewportSource = {
  ready?: () => void;
  viewportStableHeight?: number;
  isFullscreen?: boolean;
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
// Visual height can shrink ~60–100px while scrolling without a keyboard.
const KEYBOARD_SHRINK_MIN = 120;
// MainButton / Android nav. Keyboard leftovers are hundreds of px and
// would inflate the tab bar if added into --app-safe-bottom.
const CONTENT_BOTTOM_MAX = 80;
/** Telegram fullscreen header row when contentSafeAreaInset.top is missing. */
const FULLSCREEN_CONTENT_TOP_MIN = 44;

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

export function contentSafeTop(value: number, fullscreen: boolean): number {
  if (!Number.isFinite(value) || value < 0) {
    value = 0;
  }
  if (!fullscreen) {
    return Math.round(value);
  }
  return Math.max(Math.round(value), FULLSCREEN_CONTENT_TOP_MIN);
}

export function contentSafeBottom(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value > CONTENT_BOTTOM_MAX) {
    return 0;
  }
  return Math.round(value);
}

export function isKeyboardOpen(
  visualHeight: number,
  options: {
    stableHeight?: number;
    baselineHeight?: number;
    focusedField?: boolean;
  } = {},
): boolean {
  const { stableHeight, baselineHeight, focusedField = false } = options;
  const baseline = pickBaseline(stableHeight, baselineHeight);
  if (baseline == null || !Number.isFinite(visualHeight)) {
    return false;
  }
  const shrink = baseline - visualHeight;
  if (shrink <= KEYBOARD_SHRINK_MIN) {
    return false;
  }
  if (
    typeof stableHeight !== "number" &&
    typeof baselineHeight === "number" &&
    !focusedField
  ) {
    return false;
  }
  return true;
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

function isEditableFocused(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const node = document.activeElement;
  if (!node || node === document.body) {
    return false;
  }
  return (
    node instanceof HTMLInputElement ||
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLSelectElement ||
    (node instanceof HTMLElement && node.isContentEditable)
  );
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
  const fullscreen = webApp.isFullscreen === true;
  if (fullscreen) {
    root.dataset.tgFullscreen = "true";
  } else {
    delete root.dataset.tgFullscreen;
  }
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
      const inset = readInset(webApp.contentSafeAreaInset, side);
      const value =
        side === "bottom"
          ? contentSafeBottom(inset)
          : side === "top"
            ? contentSafeTop(inset, fullscreen)
            : inset;
      style.setProperty(`--tg-content-safe-area-inset-${side}`, asPx(value));
    }
  } else if (fullscreen) {
    style.setProperty(
      "--tg-content-safe-area-inset-top",
      asPx(FULLSCREEN_CONTENT_TOP_MIN),
    );
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
      focusedField: isEditableFocused(),
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
