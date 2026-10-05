"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TelegramBackButton } from "@/components/layout/telegram-back-button";

/** One back control: Telegram chrome when available, in-app chevron otherwise. */
export function AppHeaderBack({ href }: { href: string }) {
  const [telegramBack, setTelegramBack] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("@twa-dev/sdk").then((sdk) => {
      if (!cancelled && sdk.default.BackButton) {
        setTelegramBack(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <TelegramBackButton href={href} />
      {telegramBack ? null : (
        <Link
          href={href}
          className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft className="size-6" />
        </Link>
      )}
    </>
  );
}
