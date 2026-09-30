import type { Metadata } from "next";

import { PublicBarbellScreen } from "@/components/share/public-barbell-screen";
import { APP_NAME } from "@/lib/brand";
import {
  PUBLIC_BARBELL_PATH,
  publicBarbellCard,
} from "@/lib/share/barbell-public";
import { getBarbellPlayShareUrl } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const card = publicBarbellCard();
  const title = `${card.name} — ${APP_NAME}`;
  return {
    title: { absolute: title },
    description: card.summary,
    alternates: { canonical: PUBLIC_BARBELL_PATH },
    openGraph: {
      title,
      description: card.summary,
      url: PUBLIC_BARBELL_PATH,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: card.summary,
    },
  };
}

export default async function PublicBarbellPage() {
  const openUrl = await barbellOpenUrl();

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <div className="my-auto w-full max-w-md py-8">
        <PublicBarbellScreen openUrl={openUrl} />
      </div>
    </main>
  );
}

async function barbellOpenUrl(): Promise<string | null> {
  try {
    return await getBarbellPlayShareUrl();
  } catch {
    return null;
  }
}
