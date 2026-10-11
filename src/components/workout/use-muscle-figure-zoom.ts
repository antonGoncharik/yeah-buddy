"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampMusclePan,
  clampMuscleZoom,
  MUSCLE_FIGURE_ZOOM_MAX,
  MUSCLE_FIGURE_ZOOM_MIN,
  MUSCLE_FIGURE_ZOOM_STEP,
  type MuscleFigurePoint,
  muscleZoomPan,
} from "@/lib/workout/muscle-figure-zoom";

const PAN_SLOP_PX = 8;

type Gesture =
  | {
      mode: "pinch";
      startDist: number;
      startScale: number;
      startPan: MuscleFigurePoint;
      startFocal: MuscleFigurePoint;
      center: MuscleFigurePoint;
    }
  | {
      mode: "pending" | "pan";
      startPan: MuscleFigurePoint;
      startTouch: MuscleFigurePoint;
    };

function centerOf(el: HTMLElement): MuscleFigurePoint {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function touchPoint(touch: Touch): MuscleFigurePoint {
  return { x: touch.clientX, y: touch.clientY };
}

export function useMuscleFigureZoom(active: boolean, resetKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MUSCLE_FIGURE_ZOOM_MIN);
  const [pan, setPan] = useState<MuscleFigurePoint>({ x: 0, y: 0 });
  const scaleRef = useRef(MUSCLE_FIGURE_ZOOM_MIN);
  const panRef = useRef<MuscleFigurePoint>({ x: 0, y: 0 });
  const blockClickUntil = useRef(0);
  const gesture = useRef<Gesture | null>(null);

  const blockClick = useCallback(() => {
    blockClickUntil.current = performance.now() + 400;
  }, []);

  const clickBlocked = useCallback(
    () => performance.now() < blockClickUntil.current,
    [],
  );

  const commit = useCallback(
    (nextScale: number, nextPan: MuscleFigurePoint) => {
      const el = viewportRef.current;
      const clampedScale = clampMuscleZoom(nextScale);
      const clampedPan = clampMusclePan(
        nextPan,
        clampedScale,
        el?.clientWidth ?? 0,
        el?.clientHeight ?? 0,
      );
      scaleRef.current = clampedScale;
      panRef.current = clampedPan;
      setScale(clampedScale);
      setPan(clampedPan);
    },
    [],
  );

  const zoomBy = useCallback(
    (delta: number) => {
      const current = scaleRef.current;
      const next = clampMuscleZoom(current + delta);
      const ratio = current > 0 ? next / current : 1;
      commit(next, {
        x: panRef.current.x * ratio,
        y: panRef.current.y * ratio,
      });
    },
    [commit],
  );

  useEffect(() => {
    if (resetKey.length === 0) {
      return;
    }
    scaleRef.current = MUSCLE_FIGURE_ZOOM_MIN;
    panRef.current = { x: 0, y: 0 };
    setScale(MUSCLE_FIGURE_ZOOM_MIN);
    setPan({ x: 0, y: 0 });
    gesture.current = null;
  }, [resetKey]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !active) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      const inspecting = scaleRef.current > MUSCLE_FIGURE_ZOOM_MIN;
      if (!event.ctrlKey && !inspecting) {
        return;
      }
      event.preventDefault();
      const step = event.ctrlKey
        ? Math.max(-0.35, Math.min(0.35, -event.deltaY * 0.01))
        : event.deltaY > 0
          ? -0.25
          : 0.25;
      zoomBy(step);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const a = event.touches[0];
        const b = event.touches[1];
        if (!a || !b) {
          return;
        }
        const mid = {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
        };
        const center = centerOf(el);
        gesture.current = {
          mode: "pinch",
          startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          startScale: scaleRef.current,
          startPan: panRef.current,
          startFocal: { x: mid.x - center.x, y: mid.y - center.y },
          center,
        };
        return;
      }
      if (
        event.touches.length === 1 &&
        scaleRef.current > MUSCLE_FIGURE_ZOOM_MIN
      ) {
        const touch = event.touches[0];
        if (!touch) {
          return;
        }
        gesture.current = {
          mode: "pending",
          startPan: panRef.current,
          startTouch: touchPoint(touch),
        };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      const current = gesture.current;
      if (!current) {
        return;
      }
      if (current.mode === "pinch" && event.touches.length >= 2) {
        const a = event.touches[0];
        const b = event.touches[1];
        if (!a || !b || current.startDist < 1) {
          return;
        }
        event.preventDefault();
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const next = clampMuscleZoom(
          current.startScale * (dist / current.startDist),
        );
        const mid = {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
        };
        commit(
          next,
          muscleZoomPan({
            startScale: current.startScale,
            nextScale: next,
            startPan: current.startPan,
            focal: current.startFocal,
            finger: {
              x: mid.x - current.center.x,
              y: mid.y - current.center.y,
            },
          }),
        );
        blockClick();
        return;
      }
      if (current.mode !== "pending" && current.mode !== "pan") {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const dx = touch.clientX - current.startTouch.x;
      const dy = touch.clientY - current.startTouch.y;
      if (current.mode === "pending" && Math.hypot(dx, dy) < PAN_SLOP_PX) {
        return;
      }
      current.mode = "pan";
      if (event.cancelable) {
        event.preventDefault();
      }
      blockClick();
      commit(scaleRef.current, {
        x: current.startPan.x + dx,
        y: current.startPan.y + dy,
      });
    };

    const onTouchEnd = (event: TouchEvent) => {
      const current = gesture.current;
      if (current?.mode === "pinch" || current?.mode === "pan") {
        if (event.cancelable) {
          event.preventDefault();
        }
        event.stopPropagation();
        blockClick();
      }
      if (event.touches.length === 0) {
        gesture.current = null;
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!clickBlocked()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        event.button !== 0 ||
        scaleRef.current <= MUSCLE_FIGURE_ZOOM_MIN
      ) {
        return;
      }
      gesture.current = {
        mode: "pending",
        startPan: panRef.current,
        startTouch: { x: event.clientX, y: event.clientY },
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const current = gesture.current;
      if (
        !current ||
        current.mode === "pinch" ||
        event.pointerType !== "mouse"
      ) {
        return;
      }
      const dx = event.clientX - current.startTouch.x;
      const dy = event.clientY - current.startTouch.y;
      if (current.mode === "pending" && Math.hypot(dx, dy) < PAN_SLOP_PX) {
        return;
      }
      if (current.mode === "pending") {
        current.mode = "pan";
        el.setPointerCapture(event.pointerId);
      }
      blockClick();
      commit(scaleRef.current, {
        x: current.startPan.x + dx,
        y: current.startPan.y + dy,
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      if (gesture.current?.mode === "pan") {
        blockClick();
      }
      gesture.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [active, blockClick, clickBlocked, commit, zoomBy]);

  const ignoreClick = useCallback(
    () => performance.now() < blockClickUntil.current,
    [],
  );

  return {
    viewportRef,
    scale,
    pan,
    zoomIn: () => zoomBy(MUSCLE_FIGURE_ZOOM_STEP),
    zoomOut: () => zoomBy(-MUSCLE_FIGURE_ZOOM_STEP),
    atMin: scale <= MUSCLE_FIGURE_ZOOM_MIN,
    atMax: scale >= MUSCLE_FIGURE_ZOOM_MAX,
    ignoreClick,
  };
}
