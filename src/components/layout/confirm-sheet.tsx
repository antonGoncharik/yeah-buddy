"use client";

import type { ConfirmOptions } from "@/components/layout/confirm-types";
import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";

export function ConfirmSheet({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <SheetFrame title={options.message} onCancel={onCancel}>
      <Button
        type="button"
        variant={options.destructive ? "destructive" : "default"}
        className="h-14 text-lg"
        onClick={onConfirm}
      >
        {options.confirmLabel ?? "Да"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={onCancel}
      >
        {options.cancelLabel ?? "Оставить"}
      </Button>
    </SheetFrame>
  );
}
