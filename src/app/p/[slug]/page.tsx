import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProgramScreen } from "@/components/share/public-program-screen";
import { APP_NAME } from "@/lib/brand";
import { getServerEnv } from "@/lib/env";
import { PUBLIC_PROGRAMS_INDEX_TITLE } from "@/lib/messages";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumb-json-ld";
import {
  publicProgramCards,
  publicProgramIdFromSlug,
  publicProgramPath,
} from "@/lib/share/program-public";
import { programStartPayload } from "@/lib/share/program-start";
import {
  landingCtaPath,
  publicBotChatUrl,
} from "@/lib/telegram/public-bot-url";

export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return publicProgramCards().map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = publicProgramCards().find((item) => item.slug === slug);
  if (!card) {
    return {
      title: "Программа",
      robots: { index: false, follow: false },
    };
  }

  const title = `${card.name} — ${APP_NAME}`;
  const path = publicProgramPath(card.id);

  return {
    title: { absolute: title },
    description: card.summary,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: card.summary,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: card.summary,
    },
  };
}

export default async function PublicProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = publicProgramIdFromSlug(slug);
  if (!id) {
    notFound();
  }

  const card = publicProgramCards().find((item) => item.id === id);
  const openUrl = landingCtaPath(`program_${id}`);
  let qrUrl: string | null = null;
  try {
    qrUrl = publicBotChatUrl(getServerEnv(), programStartPayload(id));
  } catch {
    qrUrl = null;
  }
  const jsonLd = breadcrumbJsonLd([
    { name: "Главная", path: "/" },
    { name: PUBLIC_PROGRAMS_INDEX_TITLE, path: "/p" },
    { name: card?.name ?? "Программа", path: publicProgramPath(id) },
  ]);

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div className="my-auto w-full max-w-md py-8">
        <PublicProgramScreen id={id} openUrl={openUrl} qrUrl={qrUrl} />
      </div>
    </main>
  );
}
