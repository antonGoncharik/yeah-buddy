import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicProgramScreen } from "@/components/share/public-program-screen";
import { APP_NAME } from "@/lib/brand";
import {
  featuredProgramIdFromSlug,
  publicProgramCards,
  publicProgramPath,
} from "@/lib/share/program-public";
import { getProgramShareUrl } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";

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
  const id = featuredProgramIdFromSlug(slug);
  if (!id) {
    notFound();
  }

  const openUrl = await programBotUrl(id);

  return (
    <main className="app-viewport-min flex flex-col items-center overflow-y-auto px-6 pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
      <div className="my-auto w-full max-w-md py-8">
        <PublicProgramScreen id={id} openUrl={openUrl} />
      </div>
    </main>
  );
}

async function programBotUrl(id: Parameters<typeof getProgramShareUrl>[0]) {
  try {
    return await getProgramShareUrl(id);
  } catch {
    return null;
  }
}
