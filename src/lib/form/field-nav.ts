import type { KeyboardEvent } from "react";

const FIELD_SELECTOR =
  "input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([disabled]):not([readonly])";
const FIELD_REVEAL_GAP_PX = 16;
const FOLLOW_MS = 1200;
const VIEWPORT_FOLLOW_MS = 700;
const SLACK_CAP_PX = 1200;
const RETRY_MS = [0, 60, 160, 320, 640, 1100];
const BOTTOM_CHROME = ".app-bottom-nav, .app-sticky-actions";

let focused: HTMLElement | null = null;
let followUntil = 0;
let frame = 0;
let layoutBaseline = 0;
let retries: number[] = [];
let releaseListeners: (() => void) | null = null;

export function visibleFieldBand(
  viewport: { height: number; offsetTop: number },
  obstructTop: number | null,
  gapPx = FIELD_REVEAL_GAP_PX,
): { top: number; bottom: number } {
  const top = viewport.offsetTop + gapPx;
  let bottom = viewport.offsetTop + viewport.height - gapPx;
  if (obstructTop != null) {
    bottom = Math.min(bottom, obstructTop - gapPx);
  }
  if (bottom < top) {
    bottom = top;
  }
  return { top, bottom };
}

/**
 * Positive scrolls the field up so its bottom sits on the band.
 * A field taller than the band keeps its bottom in view and does not
 * bounce back to the top edge.
 */
export function fieldScrollDelta(
  rect: { top: number; bottom: number },
  band: { top: number; bottom: number },
): number {
  const tallerThanBand = rect.bottom - rect.top > band.bottom - band.top;
  if (rect.bottom > band.bottom) {
    return rect.bottom - band.bottom;
  }
  if (tallerThanBand || rect.top >= band.top) {
    return 0;
  }
  return rect.top - band.top;
}

export function scrollSlackPx(roomPx: number, deltaPx: number): number {
  if (deltaPx <= 0) {
    return 0;
  }
  const missing = deltaPx - roomPx;
  if (missing <= 1) {
    return 0;
  }
  return Math.ceil(missing);
}

export function keyboardFallbackPx(layoutHeight: number): number {
  if (!Number.isFinite(layoutHeight) || layoutHeight <= 0) {
    return 0;
  }
  return Math.min(420, Math.max(260, Math.round(layoutHeight * 0.42)));
}

/**
 * Bottom of the area that is actually on screen. When a focused field is up
 * and neither innerHeight nor visualViewport has shrunk, assume a keyboard
 * covers the lower portion — some Android WebViews never report it.
 */
export function visibleViewportBottom(
  layoutHeight: number,
  visualBottom: number | null,
  rememberedLayout: number,
  assumeKeyboard: boolean,
): number {
  const measured =
    visualBottom == null || !Number.isFinite(visualBottom)
      ? layoutHeight
      : Math.min(layoutHeight, visualBottom);
  if (!assumeKeyboard) {
    return measured;
  }
  const baseline = Math.max(layoutHeight, rememberedLayout);
  if (baseline - measured > 80) {
    return measured;
  }
  return Math.min(measured, layoutHeight - keyboardFallbackPx(baseline));
}

function isRevealTarget(node: EventTarget | null): node is HTMLElement {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  if (node instanceof HTMLInputElement) {
    const type = node.type;
    if (
      type === "hidden" ||
      type === "button" ||
      type === "submit" ||
      type === "reset" ||
      type === "checkbox" ||
      type === "radio" ||
      type === "file" ||
      type === "range" ||
      type === "color"
    ) {
      return false;
    }
    return !node.disabled;
  }
  if (
    node instanceof HTMLTextAreaElement ||
    node instanceof HTMLSelectElement
  ) {
    return !node.disabled;
  }
  return node.isContentEditable;
}

function armFollow(ms: number): void {
  followUntil = Math.max(followUntil, performance.now() + ms);
}

function scheduleReveal(): void {
  if (frame) {
    return;
  }
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    revealActive();
    if (focused && performance.now() < followUntil) {
      scheduleReveal();
    }
  });
}

function noteLayout(): void {
  const height = window.innerHeight;
  if (height > layoutBaseline) {
    layoutBaseline = height;
  }
}

function onOrientation(): void {
  layoutBaseline = 0;
  noteLayout();
  onViewport();
}

function clearRetries(): void {
  for (const id of retries) {
    window.clearTimeout(id);
  }
  retries = [];
}

function watchField(node: HTMLElement): void {
  focused = node;
  document.documentElement.dataset.fieldFocus = "true";
  noteLayout();
  armFollow(FOLLOW_MS);
  clearRetries();
  retries = RETRY_MS.map((ms) => window.setTimeout(scheduleReveal, ms));
  revealActive();
  scheduleReveal();
}

function bottomChromeTop(
  visibleTop: number,
  visibleBottom: number,
): number | null {
  let limit: number | null = null;
  for (const node of document.querySelectorAll<HTMLElement>(BOTTOM_CHROME)) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      continue;
    }
    const rect = node.getBoundingClientRect();
    if (
      rect.height < 1 ||
      rect.top >= visibleBottom ||
      rect.bottom <= visibleTop
    ) {
      continue;
    }
    limit = limit == null ? rect.top : Math.min(limit, rect.top);
  }
  return limit;
}

function scrollParent(node: HTMLElement): HTMLElement {
  let parent = node.parentElement;
  while (
    parent &&
    parent !== document.body &&
    parent !== document.documentElement
  ) {
    const overflow = getComputedStyle(parent).overflowY;
    if (
      overflow === "auto" ||
      overflow === "scroll" ||
      overflow === "overlay"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.scrollingElement instanceof HTMLElement
    ? document.scrollingElement
    : document.documentElement;
}

function spacerHost(scroller: HTMLElement): HTMLElement {
  if (
    scroller === document.body ||
    scroller === document.documentElement ||
    scroller === document.scrollingElement
  ) {
    return document.body;
  }
  return scroller;
}

function spacerFor(scroller: HTMLElement): HTMLElement {
  const host = spacerHost(scroller);
  for (const child of host.children) {
    if (child instanceof HTMLElement && child.dataset.keyboardSpacer != null) {
      return child;
    }
  }
  const spacer = document.createElement("div");
  spacer.dataset.keyboardSpacer = "";
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.cssText =
    "height:0;width:100%;flex:none;pointer-events:none;overflow:hidden;";
  host.appendChild(spacer);
  return spacer;
}

function clearSlack(): void {
  for (const node of document.querySelectorAll<HTMLElement>(
    "[data-keyboard-spacer]",
  )) {
    node.remove();
  }
}

function ensureRoom(scroller: HTMLElement, delta: number): void {
  const room = Math.max(
    0,
    scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop,
  );
  const missing = scrollSlackPx(room, delta);
  if (missing === 0) {
    return;
  }
  const spacer = spacerFor(scroller);
  const next = Math.min(SLACK_CAP_PX, spacer.offsetHeight + missing);
  if (next === spacer.offsetHeight) {
    return;
  }
  spacer.style.height = `${next}px`;
}

function isDocumentScroller(scroller: HTMLElement): boolean {
  return (
    scroller === document.scrollingElement ||
    scroller === document.documentElement ||
    scroller === document.body
  );
}

function scrollTarget(scroller: HTMLElement, delta: number): boolean {
  const before = scroller.scrollTop;
  scroller.scrollTop = before + delta;
  return Math.abs(scroller.scrollTop - before) >= 1;
}

function scrollByDelta(node: HTMLElement, delta: number): void {
  if (Math.abs(delta) < 1) {
    return;
  }
  const nested = scrollParent(node);
  if (!isDocumentScroller(nested)) {
    if (delta > 0) {
      ensureRoom(nested, delta);
    }
    if (scrollTarget(nested, delta)) {
      return;
    }
  }

  const root =
    document.scrollingElement instanceof HTMLElement
      ? document.scrollingElement
      : document.documentElement;
  if (delta > 0) {
    ensureRoom(root, delta);
  }
  if (scrollTarget(root, delta)) {
    return;
  }
  if (scrollTarget(document.documentElement, delta)) {
    return;
  }
  if (scrollTarget(document.body, delta)) {
    return;
  }
  node.scrollIntoView({ block: "center", inline: "nearest" });
}

function revealActive(): void {
  const node = focused;
  if (!node?.isConnected) {
    return;
  }
  if (
    document.activeElement !== node &&
    !node.contains(document.activeElement)
  ) {
    return;
  }

  noteLayout();
  const viewport = window.visualViewport;
  const offsetTop = viewport?.offsetTop ?? 0;
  const visualBottom = viewport ? viewport.height + viewport.offsetTop : null;
  const bottom = visibleViewportBottom(
    window.innerHeight,
    visualBottom,
    layoutBaseline,
    true,
  );
  const metrics = {
    height: Math.max(0, bottom - offsetTop),
    offsetTop,
  };
  const visibleTop = metrics.offsetTop;
  const visibleBottom = metrics.offsetTop + metrics.height;
  const band = visibleFieldBand(
    metrics,
    bottomChromeTop(visibleTop, visibleBottom),
  );
  const delta = fieldScrollDelta(node.getBoundingClientRect(), band);
  if (Math.abs(delta) < 1) {
    return;
  }
  scrollByDelta(node, delta);
}

function onFocusIn(event: FocusEvent): void {
  if (!isRevealTarget(event.target)) {
    return;
  }
  watchField(event.target);
}

function onFocusOut(): void {
  const ticket = focused;
  window.setTimeout(() => {
    if (focused !== ticket) {
      return;
    }
    const active = document.activeElement;
    if (isRevealTarget(active)) {
      focused = active;
      return;
    }
    focused = null;
    followUntil = 0;
    clearRetries();
    delete document.documentElement.dataset.fieldFocus;
    clearSlack();
  }, 30);
}

function onViewport(): void {
  if (!focused) {
    return;
  }
  armFollow(VIEWPORT_FOLLOW_MS);
  scheduleReveal();
}

function install(): () => void {
  if (releaseListeners) {
    return releaseListeners;
  }
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", onFocusOut, true);
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", onViewport);
  viewport?.addEventListener("scroll", onViewport);
  window.addEventListener("resize", onViewport);
  window.addEventListener("orientationchange", onOrientation);
  noteLayout();
  releaseListeners = () => {
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focusout", onFocusOut, true);
    viewport?.removeEventListener("resize", onViewport);
    viewport?.removeEventListener("scroll", onViewport);
    window.removeEventListener("resize", onViewport);
    window.removeEventListener("orientationchange", onOrientation);
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    clearRetries();
    focused = null;
    followUntil = 0;
    layoutBaseline = 0;
    delete document.documentElement.dataset.fieldFocus;
    clearSlack();
    releaseListeners = null;
  };
  return releaseListeners;
}

export function bindFieldReveal(): () => void {
  return install();
}

export function revealField(node: HTMLElement): void {
  if (typeof window === "undefined" || !isRevealTarget(node)) {
    return;
  }
  install();
  watchField(node);
}

export function handleNumericEnter(
  event: KeyboardEvent<HTMLInputElement>,
): void {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  const input = event.currentTarget;
  const root = input.form ?? input.closest("[data-field-group]");
  const fields = root
    ? Array.from(root.querySelectorAll<HTMLInputElement>(FIELD_SELECTOR))
    : [];
  const index = fields.indexOf(input);
  const next = index >= 0 ? fields[index + 1] : undefined;
  if (next) {
    next.focus();
    next.select();
    return;
  }

  if (input.form) {
    input.form.requestSubmit();
    return;
  }

  input.blur();
}
