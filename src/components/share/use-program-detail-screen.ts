"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { mutateJson, postJson } from "@/lib/api-cache";
import { packQrCaption } from "@/lib/flavor";
import { LOAD_FAILED } from "@/lib/messages";
import { shareOrCopyLink } from "@/lib/share/client";
import { dismissPendingProgramId } from "@/lib/share/pending";
import {
  type FeaturedProgramDetail,
  featuredProgramPreset,
  isFeaturedProgramId,
  programApplyConfirmMessage,
  programShareText,
  readFeaturedProgramPayload,
} from "@/lib/share/program-start";
import { haptic } from "@/lib/telegram/haptic";

export function useProgramDetailScreen(id: string) {
  const router = useRouter();
  const confirm = useConfirm();
  const programId = isFeaturedProgramId(id) ? id : null;
  const [program, setProgram] = useState<FeaturedProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (programId) {
      dismissPendingProgramId(programId);
    }
  }, [programId]);

  const load = useCallback(async () => {
    if (!programId) {
      setProgram(null);
      setError(LOAD_FAILED);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/programs/${programId}`);
      const loaded = readFeaturedProgramPayload(data);
      if (!loaded) {
        throw new Error(LOAD_FAILED);
      }
      setProgram(loaded);
    } catch (caught) {
      setProgram(null);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    void load();
  }, [load]);

  function leave() {
    if (programId) {
      dismissPendingProgramId(programId);
    }
    router.replace("/workouts");
  }

  async function onApply() {
    if (!program || program.applied) {
      return;
    }
    const preset = featuredProgramPreset(program.id);
    const ok = await confirm({
      message: programApplyConfirmMessage(preset),
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await postJson("/api/templates/presets", { preset: program.id });
      dismissPendingProgramId(program.id);
      haptic("success");
      router.replace("/workouts");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!program?.share_url) {
      return;
    }
    try {
      const result = await shareOrCopyLink(
        program.share_url,
        programShareText(featuredProgramPreset(program.id)),
      );
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    }
  }

  return {
    program,
    loading,
    error,
    busy,
    copied,
    qrCaption: packQrCaption("workouts"),
    load,
    leave,
    onApply,
    onShare,
  };
}
