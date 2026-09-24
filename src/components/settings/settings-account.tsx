"use client";

import { useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { downloadJsonFile } from "@/lib/account/download";
import { accountExportFilename } from "@/lib/account/export-shape";
import { clearDiaryCache, deleteJson, mutateJson } from "@/lib/api-cache";
import { ACCOUNT_DELETE_CONFIRM, LOAD_FAILED } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import { haptic } from "@/lib/telegram/haptic";

export function SettingsAccount() {
  const confirm = useConfirm();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  async function onExport() {
    setBusy("export");
    setError(null);
    setExported(false);
    try {
      const dump = readAccountExport(await mutateJson("/api/account/export"));
      if (!dump) {
        throw new Error(LOAD_FAILED);
      }
      downloadJsonFile(accountExportFilename(dump.exported_at), dump.payload);
      haptic("commit");
      setExported(true);
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      message: ACCOUNT_DELETE_CONFIRM,
      confirmLabel: "Удалить",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy("delete");
    setError(null);
    try {
      await deleteJson("/api/account");
      clearDiaryCache();
      haptic("commit");
      window.location.assign("/today");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setBusy(null);
    }
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <h2 className="text-xl font-semibold">Данные</h2>
      <p className="text-sm text-muted-foreground">
        Скачай копию дневника или удали всё с сервера
      </p>
      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={busy != null}
        onClick={() => void onExport()}
      >
        {busy === "export" ? "Собираю…" : exported ? "Скачано" : "Скачать JSON"}
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="h-12 text-base"
        disabled={busy != null}
        onClick={() => void onDelete()}
      >
        {busy === "delete" ? "Удаляю…" : "Удалить дневник"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

function readAccountExport(
  data: unknown,
): { exported_at: string; payload: Record<string, unknown> } | null {
  if (!isRecord(data) || !isRecord(data.export)) {
    return null;
  }

  const dump = data.export;
  if (typeof dump.exported_at !== "string" || dump.exported_at === "") {
    return null;
  }

  return { exported_at: dump.exported_at, payload: dump };
}
