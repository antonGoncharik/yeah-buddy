import { Button } from "@/components/ui/button";

export function TemplateReview({
  lines,
  fitLabel,
  disabled,
  pending,
  onFit,
}: {
  lines: string[];
  fitLabel: string | null;
  disabled: boolean;
  pending: boolean;
  onFit: () => void;
}) {
  if (lines.length === 0 && fitLabel == null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {lines.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <li key={line} className="text-base leading-snug text-foreground">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
      {fitLabel ? (
        <Button
          type="button"
          variant="secondary"
          className="h-12 w-full text-base"
          disabled={disabled}
          onClick={onFit}
        >
          {pending ? "Подгоняю…" : fitLabel}
        </Button>
      ) : null}
    </div>
  );
}
