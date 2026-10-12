import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OutsideTelegramScreen } from "@/components/layout/outside-telegram-screen";
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from "@/lib/brand";
import { getServerEnv } from "@/lib/env";
import { OPEN_VIA_BOT_FAQ } from "@/lib/messages";
import { siteOriginUrl } from "@/lib/site-url";
import {
  landingCtaPath,
  publicBotChatUrl,
} from "@/lib/telegram/public-bot-url";

export const revalidate = 86400;

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

export default function HomePage() {
  if (process.env.NODE_ENV !== "production") {
    redirect("/today");
  }

  const openUrl = landingCtaPath("hero");
  let qrUrl: string | null = null;
  try {
    qrUrl = publicBotChatUrl(getServerEnv());
  } catch {
    qrUrl = null;
  }
  const origin = siteOriginUrl().origin;
  const jsonLd = [
    {
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
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: OPEN_VIA_BOT_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      {jsonLd.map((block) => (
        <script key={block["@type"]} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
      <div className="my-auto w-full max-w-5xl py-10 sm:py-14">
        <OutsideTelegramScreen openUrl={openUrl} qrUrl={qrUrl} />
      </div>
    </main>
  );
}
