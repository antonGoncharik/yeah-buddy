import type { Metadata } from "next";

import { PackDetailScreen } from "@/components/share/pack-detail-screen";
import { APP_NAME } from "@/lib/brand";
import {
  packOpenGraphFallbackTitle,
  publicPackOpenGraph,
} from "@/lib/share/pack-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const pack = await publicPackOpenGraph(token);
  if (!pack) {
    return {
      title: packOpenGraphFallbackTitle(),
      robots: { index: false, follow: false },
    };
  }

  return {
    title: pack.title,
    description: pack.description,
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: APP_NAME,
      title: pack.title,
      description: pack.description,
    },
    twitter: {
      card: "summary",
      title: pack.title,
      description: pack.description,
    },
  };
}

export default async function PackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PackDetailScreen token={token} />;
}
