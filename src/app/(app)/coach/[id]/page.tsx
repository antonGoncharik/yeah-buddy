import { CoachBoardScreen } from "@/components/coach/coach-board-screen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachBoardPage({ params }: PageProps) {
  const { id } = await params;
  return <CoachBoardScreen grantId={id} />;
}
