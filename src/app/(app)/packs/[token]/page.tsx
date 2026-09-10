import { PackDetailScreen } from "@/components/share/pack-detail-screen";

export default async function PackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PackDetailScreen token={token} />;
}
