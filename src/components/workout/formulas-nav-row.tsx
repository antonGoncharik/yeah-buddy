"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/layout/confirm-provider";

/**
 * Row that opens a sub-screen of the set scheme. If there are unsaved edits,
 * offers to save them first, so nothing is silently lost.
 */
export function FormulasNavRow({
  href,
  title,
  hint,
  dirty,
  busy,
  onSave,
}: {
  href: string;
  title: string;
  hint: string;
  dirty: boolean;
  busy: boolean;
  onSave: () => Promise<boolean>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function open() {
    if (dirty) {
      const save = await confirm({
        message: "Есть несохранённые изменения. Сохранить перед переходом?",
        confirmLabel: "Сохранить",
        cancelLabel: "Не сохранять",
      });
      if (save && !(await onSave())) {
        return;
      }
    }
    router.push(href);
  }

  return (
    <button
      type="button"
      disabled={busy}
      className="card-surface animate-rise flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      onClick={() => void open()}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {hint}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </button>
  );
}
