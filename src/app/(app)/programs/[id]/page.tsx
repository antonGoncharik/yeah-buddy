import { notFound } from "next/navigation";

import { ProgramDetailScreen } from "@/components/share/program-detail-screen";
import { isPublicProgramId } from "@/lib/share/program-public";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isPublicProgramId(id)) {
    notFound();
  }

  return <ProgramDetailScreen id={id} />;
}
