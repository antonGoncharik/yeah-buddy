import { cn } from "@/lib/utils";

export function TextBone({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block max-w-full", className)}>
      <span className="invisible">{text}</span>
      <span className="absolute inset-x-0 top-[0.12em] bottom-[0.08em] animate-pulse rounded-[0.2em] bg-foreground/25" />
    </span>
  );
}

export function IconBone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 animate-pulse rounded-md bg-foreground/25",
        className,
      )}
    />
  );
}

export function NavRowSkeleton({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 py-2.5">
      <IconBone className="size-9 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-medium">
          <TextBone text={title} />
        </span>
        {hint ? (
          <span className="mt-0.5 block text-sm leading-snug">
            <TextBone text={hint} />
          </span>
        ) : null}
      </span>
      <IconBone className="size-5" />
    </div>
  );
}

export function SwitchRowSkeleton({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base font-medium">
          <TextBone text={label} />
        </p>
        <p className="text-sm">
          <TextBone text={hint} />
        </p>
      </div>
      <span
        className="relative h-6 w-10 shrink-0 rounded-full bg-foreground/20"
        aria-hidden
      >
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-background" />
      </span>
    </div>
  );
}
