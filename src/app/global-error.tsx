"use client";

import { AppRouteError } from "@/components/layout/app-route-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppRouteError error={error} reset={reset} homeHref="/" />
      </body>
    </html>
  );
}
