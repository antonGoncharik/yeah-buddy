"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  pushWizardScreenEntry,
  readWizardScreenEntry,
  replaceWizardScreenEntry,
  type WizardScreenEntry,
} from "@/lib/navigation/wizard-history";

export function useWizardScreenHistory({
  flow,
  step,
  sub = null,
  enabled,
  onRestore,
}: {
  flow: string;
  step: string;
  sub?: string | null;
  enabled: boolean;
  onRestore: (entry: WizardScreenEntry) => void;
}): { retreat: () => void } {
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const fromPopRef = useRef(false);
  const seededRef = useRef(false);
  const entryRef = useRef({ step, sub: sub ?? null });

  entryRef.current = { step, sub: sub ?? null };

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const onPop = () => {
      const parsed = readWizardScreenEntry(window.history.state);
      if (parsed == null || parsed.flow !== flow) {
        return;
      }
      fromPopRef.current = true;
      onRestoreRef.current(parsed);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enabled, flow]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const next: WizardScreenEntry = {
      flow,
      step,
      sub: sub ?? null,
    };
    const current = readWizardScreenEntry(window.history.state);
    if (
      current?.flow === flow &&
      current.step === next.step &&
      current.sub === next.sub
    ) {
      return;
    }

    if (fromPopRef.current) {
      fromPopRef.current = false;
      return;
    }

    if (!seededRef.current) {
      replaceWizardScreenEntry(next);
      seededRef.current = true;
      return;
    }

    pushWizardScreenEntry(next);
  }, [enabled, flow, step, sub]);

  const retreat = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.history.back();
  }, []);

  return { retreat };
}
