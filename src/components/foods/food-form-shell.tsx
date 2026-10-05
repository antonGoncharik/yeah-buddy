"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

/** Shared chrome for catalog create/edit product screens. */
export function FoodFormShell({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <AppHeader title={title} backHref={backHref} />
      <div className="px-4 pb-3">{children}</div>
    </div>
  );
}
