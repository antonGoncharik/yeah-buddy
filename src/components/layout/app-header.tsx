import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function AppHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/70 bg-background/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          className="flex size-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
          aria-label="Назад"
        >
          <ChevronLeft className="size-6" />
        </Link>
      ) : null}
      <h1 className="truncate text-2xl font-semibold tracking-tight">
        {title}
      </h1>
    </header>
  );
}
