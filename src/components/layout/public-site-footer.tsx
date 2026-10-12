import Link from "next/link";

import { APP_NAME } from "@/lib/brand";
import {
  PUBLIC_FOOTER_CONTACT,
  PUBLIC_FOOTER_PRIVACY,
  PUBLIC_FOOTER_TERMS,
} from "@/lib/messages";

export function PublicSiteFooter() {
  return (
    <footer className="w-full border-t border-border pt-8 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{APP_NAME}</p>
      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/legal/privacy" className="hover:text-foreground">
          {PUBLIC_FOOTER_PRIVACY}
        </Link>
        <Link href="/legal/terms" className="hover:text-foreground">
          {PUBLIC_FOOTER_TERMS}
        </Link>
        <a href={PUBLIC_FOOTER_CONTACT.href} className="hover:text-foreground">
          {PUBLIC_FOOTER_CONTACT.label}
        </a>
      </nav>
      <p className="mt-4 max-w-xl text-xs leading-relaxed">
        Дневник питания и тренировок в Telegram. Это не медицинская рекомендация
        — цели и нагрузку выбираешь сам.
      </p>
    </footer>
  );
}
