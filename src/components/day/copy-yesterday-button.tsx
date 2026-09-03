"use client";

import { Button } from "@/components/ui/button";

export function CopyYesterdayButton({
  onCopy,
  busy,
}: {
  onCopy: () => void;
  busy: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full text-base"
      disabled={busy}
      onClick={onCopy}
    >
      Скопировать вчера
    </Button>
  );
}
