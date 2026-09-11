"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { ApiError, mutateJson } from "@/lib/api-cache";
import { ensureTodayDay } from "@/lib/day/ensure-today";
import { LOAD_FAILED, PACK_NOT_FOUND } from "@/lib/messages";
import { shareOrCopyLink } from "@/lib/share/client";
import { readSharePackPayload } from "@/lib/share/map";
import { packShareText } from "@/lib/share/payload";
import {
  dismissPendingPackToken,
  packPath,
  parsePackBackFrom,
} from "@/lib/share/pending";
import type { SharePackDetail } from "@/lib/share/types";
import { haptic } from "@/lib/telegram/haptic";

export function usePackDetailScreen(token: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const from = parsePackBackFrom(searchParams.get("from"));
  const [pack, setPack] = useState<SharePackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const savingCopy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/packs/${token}`);
      const loaded = readSharePackPayload(data);
      if (!loaded) {
        throw new Error(LOAD_FAILED);
      }
      setPack(loaded);
      if (loaded.mine || loaded.saved) {
        dismissPendingPackToken(token);
      }
    } catch (caught) {
      setPack(null);
      if (caught instanceof ApiError && caught.status === 404) {
        dismissPendingPackToken(token);
        setError(PACK_NOT_FOUND);
        return;
      }
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pack || pack.mine || pack.saved || savingCopy.current) {
      return;
    }

    savingCopy.current = true;
    void (async () => {
      try {
        const data = await mutateJson(`/api/packs/${pack.token}/save`, {
          method: "POST",
        });
        const loaded = readSharePackPayload(data);
        if (!loaded) {
          savingCopy.current = false;
          return;
        }
        dismissPendingPackToken(token);
        setPack(loaded);
        if (loaded.token !== token) {
          router.replace(packPath(loaded.token, from ?? undefined));
        }
      } catch {
        savingCopy.current = false;
      }
    })();
  }, [from, pack, router, token]);

  async function onApply() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message:
        pack.kind === "meals"
          ? "Шаблоны еды и цели белка, жира и углеводов станут как в ссылке. Уже записанные дни не тронем."
          : "Очередь и схема весов станут как в ссылке. Рабочие веса твои. Свои тренировки отложатся.",
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await mutateJson(`/api/packs/${pack.token}/apply`, { method: "POST" });
      dismissPendingPackToken(token);
      haptic("success");
      if (pack.kind === "meals") {
        try {
          await ensureTodayDay("rest");
        } catch {
          // still open today
        }
        router.replace("/today");
        return;
      }
      router.replace("/workouts");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    if (!pack) {
      return;
    }
    const url = pack.share_url ?? window.location.href;
    try {
      const result = await shareOrCopyLink(
        url,
        packShareText(pack.kind, pack.title),
      );
      setCopied(result === "copied");
    } catch {
      setError(LOAD_FAILED);
    }
  }

  async function onRevoke() {
    if (!pack) {
      return;
    }
    const ok = await confirm({
      message: "Убрать ссылку? У тебя копия останется, у друзей — нет.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/packs/${pack.token}/revoke`, {
        method: "POST",
      });
      const loaded = readSharePackPayload(data);
      if (loaded) {
        setPack(loaded);
        haptic("commit");
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const ownLive = Boolean(pack?.mine && !pack.revoked);

  return {
    pack,
    loading,
    error,
    busy,
    copied,
    from,
    ownLive,
    load,
    onApply,
    onShare,
    onRevoke,
  };
}
