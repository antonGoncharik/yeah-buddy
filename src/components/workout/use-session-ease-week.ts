"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { postJson } from "@/lib/api-cache";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
import { type EaseWeekKind, easeWeekConfirm } from "@/lib/workout/ease-week";
import { sessionFailAction } from "@/lib/workout/session-action-errors";

export function useSessionEaseWeek({
  detail,
  easeWeek,
  easeSessionId,
  setBusy,
  setError,
  onApplied,
}: {
  detail: SessionDetail | null;
  easeWeek: EaseWeekKind | null;
  easeSessionId: string | null;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  onApplied: (sessionDate: string) => Promise<void>;
}) {
  const confirm = useConfirm();

  const activeEaseWeek =
    detail && easeWeek && detail.session.id === easeSessionId ? easeWeek : null;

  async function easeWeekNow(): Promise<boolean> {
    if (!detail || easeWeek == null || detail.session.id !== easeSessionId) {
      return false;
    }
    const kind = easeWeek;
    const ok = await confirm({
      message: easeWeekConfirm(kind),
      confirmLabel: kind === "deload" ? "Открыть" : "Снизить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      await postJson(`/api/sessions/${detail.session.id}/ease-week`, {});
      haptic("success");
      await onApplied(detail.session.session_date);
      return true;
    } catch (caught) {
      sessionFailAction((message) => setError(message), caught);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { easeWeek: activeEaseWeek, easeWeekNow };
}
