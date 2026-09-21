"use client";

import { Button } from "@/components/ui/button";

export function CopyYesterdayButton({
  onCopy,
  busy,
  label = "Как вчера",
  variant = "outline",
}: {
  onCopy: () => void;
  busy: boolean;
  label?: string;
  variant?: "outline" | "default";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      className="h-14 w-full text-lg"
      disabled={busy}
      onClick={onCopy}
    >
      {label}
    </Button>
  );
}
