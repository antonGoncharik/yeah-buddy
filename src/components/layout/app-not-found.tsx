import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppNotFound({
  title = "Страницы нет",
  description = "Ссылка устарела или адрес набран с ошибкой.",
  homeHref = "/today",
  homeLabel = "На сегодня",
}: {
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <main
      className="app-viewport-min mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-10 text-center"
      data-diary-compact-scope
    >
      <Image
        src="/stickers/trex.webp"
        alt=""
        width={160}
        height={160}
        className="size-32 rounded-2xl object-cover"
      />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-base text-muted-foreground">{description}</p>
      <Link
        href={homeHref}
        className={cn(buttonVariants(), "h-12 min-h-11 min-w-40 text-base")}
      >
        {homeLabel}
      </Link>
    </main>
  );
}
