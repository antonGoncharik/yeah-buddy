"use client";

import { AppRouteError } from "@/components/layout/app-route-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppRouteError error={error} reset={reset} />;
}
