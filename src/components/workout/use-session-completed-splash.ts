"use client";

import { useEffect, useRef, useState } from "react";

import { PLATE_BURST_MS, SPLASH_HOLD_MS } from "@/lib/flavor";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionFeel } from "@/lib/types";

export function useSessionCompletedSplash(feel: SessionFeel | null) {
  const [extraPlate, setExtraPlate] = useState(false);
  const [lightWeight, setLightWeight] = useState(false);
  const plateHold = useRef<number | null>(null);
  const titleHold = useRef<number | null>(null);

  useEffect(() => {
    if (!extraPlate) {
      return;
    }
    const timer = window.setTimeout(() => setExtraPlate(false), PLATE_BURST_MS);
    return () => window.clearTimeout(timer);
  }, [extraPlate]);

  useEffect(() => {
    return () => {
      if (plateHold.current != null) {
        window.clearTimeout(plateHold.current);
      }
      if (titleHold.current != null) {
        window.clearTimeout(titleHold.current);
      }
    };
  }, []);

  function burstPlate() {
    haptic("tick");
    setExtraPlate(true);
  }

  function startPlateHold() {
    if (plateHold.current != null) {
      window.clearTimeout(plateHold.current);
    }
    plateHold.current = window.setTimeout(() => {
      plateHold.current = null;
      burstPlate();
    }, SPLASH_HOLD_MS);
  }

  function endPlateHold() {
    if (plateHold.current != null) {
      window.clearTimeout(plateHold.current);
      plateHold.current = null;
    }
  }

  function startTitleHold() {
    if (feel !== "easy" || lightWeight) {
      return;
    }
    if (titleHold.current != null) {
      window.clearTimeout(titleHold.current);
    }
    titleHold.current = window.setTimeout(() => {
      titleHold.current = null;
      setLightWeight(true);
      haptic("success");
    }, SPLASH_HOLD_MS);
  }

  function endTitleHold() {
    if (titleHold.current != null) {
      window.clearTimeout(titleHold.current);
      titleHold.current = null;
    }
  }

  async function raise(onRaise: () => Promise<boolean>) {
    if (await onRaise()) {
      setExtraPlate(true);
    }
  }

  const easyPointer =
    feel === "easy"
      ? {
          onPointerDown: startTitleHold,
          onPointerUp: endTitleHold,
          onPointerLeave: endTitleHold,
          onPointerCancel: endTitleHold,
        }
      : {};

  const barbellPointer = {
    onPointerDown: startPlateHold,
    onPointerUp: endPlateHold,
    onPointerLeave: endPlateHold,
    onPointerCancel: endPlateHold,
  };

  return {
    extraPlate,
    lightWeight,
    easyPointer,
    barbellPointer,
    raise,
  };
}
