"use client";

import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export function AppRouteError({
  error,
  reset,
  homeHref = "/today",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

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
        priority
      />
      <h1 className="text-xl font-semibold">Что-то сломалось</h1>
      <p className="text-base text-muted-foreground">
        Попробуй ещё раз или вернись на сегодня.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button
          type="button"
          className="h-12 min-h-11 text-base"
          onClick={() => reset()}
        >
          Повторить
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-12 min-h-11 text-base"
          onClick={() => router.push(homeHref)}
        >
          На сегодня
        </Button>
      </div>
    </main>
  );
}
