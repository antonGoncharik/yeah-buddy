import { notFound } from "next/navigation";

import { ProgramDetailScreen } from "@/components/share/program-detail-screen";
import { isFeaturedProgramId } from "@/lib/share/program-start";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isFeaturedProgramId(id)) {
    notFound();
  }

  return <ProgramDetailScreen id={id} />;
}
