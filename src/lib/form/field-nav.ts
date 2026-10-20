import type { KeyboardEvent } from "react";

const FIELD_SELECTOR =
  "input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([disabled]):not([readonly])";
const FIELD_REVEAL_GAP_PX = 16;
const FOLLOW_MS = 800;
const VIEWPORT_FOLLOW_MS = 400;
const SLACK_CAP_PX = 1200;
const BOTTOM_CHROME = ".app-bottom-nav, .app-sticky-actions";

let focused: HTMLElement | null = null;
let followUntil = 0;
let frame = 0;
let stuckScrolls = 0;
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

function watchField(node: HTMLElement): void {
  focused = node;
  stuckScrolls = 0;
  armFollow(FOLLOW_MS);
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

function scrollOffset(scroller: HTMLElement): number {
  return isDocumentScroller(scroller) ? window.scrollY : scroller.scrollTop;
}

function scrollScroller(scroller: HTMLElement, delta: number): void {
  if (Math.abs(delta) < 1) {
    return;
  }
  if (isDocumentScroller(scroller)) {
    const scrolling = document.scrollingElement;
    if (scrolling) {
      scrolling.scrollTop += delta;
    }
    return;
  }
  scroller.scrollTop += delta;
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

  const viewport = window.visualViewport;
  const metrics = viewport ?? {
    height: window.innerHeight,
    offsetTop: 0,
  };
  const visibleTop = metrics.offsetTop;
  const visibleBottom = metrics.offsetTop + metrics.height;
  const band = visibleFieldBand(
    metrics,
    bottomChromeTop(visibleTop, visibleBottom),
  );
  let delta = fieldScrollDelta(node.getBoundingClientRect(), band);
  if (Math.abs(delta) < 1) {
    return;
  }

  const scroller = scrollParent(node);
  if (delta > 0) {
    ensureRoom(scroller, delta);
    delta = fieldScrollDelta(node.getBoundingClientRect(), band);
  }
  if (Math.abs(delta) < 1) {
    return;
  }
  const before = scrollOffset(scroller);
  scrollScroller(scroller, delta);
  if (Math.abs(scrollOffset(scroller) - before) < 1) {
    stuckScrolls += 1;
    if (stuckScrolls > 2) {
      followUntil = 0;
    }
    return;
  }
  stuckScrolls = 0;
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
  releaseListeners = () => {
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focusout", onFocusOut, true);
    viewport?.removeEventListener("resize", onViewport);
    viewport?.removeEventListener("scroll", onViewport);
    window.removeEventListener("resize", onViewport);
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    focused = null;
    followUntil = 0;
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
