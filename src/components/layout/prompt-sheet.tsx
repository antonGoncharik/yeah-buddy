"use client";

import { useState } from "react";
import type { PromptOptions } from "@/components/layout/confirm-types";
import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PromptSheet({
  options,
  onConfirm,
  onCancel,
}: {
  options: PromptOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(options.defaultValue ?? "");
  const trimmed = value.trim();

  return (
    <SheetFrame title={options.message} onCancel={onCancel}>
      <Input
        autoFocus
        value={value}
        placeholder={options.placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && trimmed !== "") {
            event.preventDefault();
            onConfirm(trimmed);
          }
        }}
        className="h-12 text-base"
      />
      <Button
        type="button"
        className="h-14 text-lg"
        disabled={trimmed === ""}
        onClick={() => onConfirm(trimmed)}
      >
        {options.confirmLabel ?? "Сохранить"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={onCancel}
      >
        {options.cancelLabel ?? "Отмена"}
      </Button>
    </SheetFrame>
  );
}
