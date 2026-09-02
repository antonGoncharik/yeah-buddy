import Link from "next/link";

export function AppHeader({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-11 min-w-11 items-center justify-center rounded-lg text-base font-medium"
        >
          Назад
        </Link>
      ) : null}
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
