"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { readSharePackPayload } from "@/lib/share/map";
import type { SharePackKind } from "@/lib/share/payload";
import { packPath } from "@/lib/share/pending";
import { cn } from "@/lib/utils";

export function PublishPackButton({
  kind,
  className,
}: {
  kind: SharePackKind;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPublish() {
    setBusy(true);
    setError(null);
    try {
      const data = await postJson("/api/packs", { kind });
      const pack = readSharePackPayload(data);
      if (!pack) {
        setError(LOAD_FAILED);
        return;
      }
      router.push(packPath(pack.token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        className={cn("h-14 text-lg", className)}
        disabled={busy}
        onClick={() => void onPublish()}
      >
        {busy
          ? "Сохранение…"
          : kind === "meals"
            ? "Поделиться едой"
            : "Поделиться залом"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
