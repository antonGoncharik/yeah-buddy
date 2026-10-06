import { BuddyBoardScreen } from "@/components/buddy/buddy-board-screen";

export default async function BuddyBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BuddyBoardScreen grantId={id} />;
}
