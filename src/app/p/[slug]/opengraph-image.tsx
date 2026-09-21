import { notFound } from "next/navigation";

import {
  PROGRAM_OG_CONTENT_TYPE,
  PROGRAM_OG_SIZE,
  programOgImage,
} from "@/lib/og/program-image";
import { featuredProgramIdFromSlug } from "@/lib/share/program-public";

export const alt = "Программа — Yeah Buddy";
export const size = PROGRAM_OG_SIZE;
export const contentType = PROGRAM_OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = featuredProgramIdFromSlug(slug);
  if (!id) {
    notFound();
  }
  return programOgImage(id);
}
