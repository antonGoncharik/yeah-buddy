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
  root: CSSStyleDeclaration,
  sizes: { layoutHeight: number; visualBottom?: number },
): void {
  const { layoutHeight, visualBottom } = sizes;
  const stable = webApp.viewportStableHeight;
  if (typeof stable === "number" && Number.isFinite(stable) && stable > 0) {
    root.setProperty("--tg-viewport-stable-height", asPx(stable));
    root.setProperty(
      "--app-chrome-bottom",
      asPx(chromeBottomShift(layoutHeight, stable)),
    );
  }

  const extra =
    visualBottom === undefined ? 0 : extraBottomGap(layoutHeight, visualBottom);

  if (webApp.safeAreaInset) {
    for (const side of SIDES) {
      const safe = readInset(webApp.safeAreaInset, side);
      const fallback = side === "bottom" ? extra : 0;
      root.setProperty(
        `--tg-safe-area-inset-${side}`,
        asPx(Math.max(safe, fallback)),
      );
    }
  } else if (extra > 0) {
    root.setProperty("--tg-safe-area-inset-bottom", asPx(extra));
  }

  if (webApp.contentSafeAreaInset) {
    for (const side of SIDES) {
      root.setProperty(
        `--tg-content-safe-area-inset-${side}`,
        asPx(readInset(webApp.contentSafeAreaInset, side)),
      );
    }
  }
}

function currentSizes(): { layoutHeight: number; visualBottom?: number } {
  const viewport = window.visualViewport;
  return {
    layoutHeight: window.innerHeight,
    visualBottom: viewport ? viewport.height + viewport.offsetTop : undefined,
  };
}

export function bindTelegramViewport(
  webApp: TelegramViewportSource,
): () => void {
  webApp.ready?.();

  const sync = () => {
    syncTelegramViewport(
      webApp,
      document.documentElement.style,
      currentSizes(),
    );
  };

  sync();
  for (const event of EVENTS) {
    webApp.onEvent(event, sync);
  }

  const timeouts = RETRY_MS.map((ms) => window.setTimeout(sync, ms));
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", sync);
  viewport?.addEventListener("scroll", sync);

  return () => {
    for (const event of EVENTS) {
      webApp.offEvent(event, sync);
    }
    for (const id of timeouts) {
      window.clearTimeout(id);
    }
    viewport?.removeEventListener("resize", sync);
    viewport?.removeEventListener("scroll", sync);
  };
}
