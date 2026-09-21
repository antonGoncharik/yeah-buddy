import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OutsideTelegramScreen } from "@/components/layout/outside-telegram-screen";
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from "@/lib/brand";
import { siteOriginUrl } from "@/lib/site-url";
import { getAppShareUrl } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: APP_TITLE },
  description: APP_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: "/",
  },
};

export default async function HomePage() {
  // Local dev has no public landing: the diary opens through /api/auth/dev.
  if (process.env.NODE_ENV !== "production") {
    redirect("/today");
  }

  const openUrl = await publicBotUrl();
  const origin = siteOriginUrl().origin;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: APP_NAME,
    url: origin,
    description: APP_DESCRIPTION,
    applicationCategory: "HealthApplication",
    operatingSystem: "Telegram",
    inLanguage: "ru",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RUB",
    },
  };

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div className="my-auto w-full max-w-md py-8">
        <OutsideTelegramScreen openUrl={openUrl} origin={origin} />
      </div>
    </main>
  );
}

async function publicBotUrl(): Promise<string | null> {
  try {
    return await getAppShareUrl();
  } catch {
    return null;
  }
}
