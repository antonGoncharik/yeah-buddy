import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RemoveRowButton({
  label = "Убрать",
  disabled,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      className="size-11"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <X className="size-5" />
    </Button>
  );
}
