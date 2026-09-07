import { TodayScreen } from "@/components/day/today-screen";

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : undefined;
  const readOnly = params.view === "history";
  return <TodayScreen initialDate={date} readOnly={readOnly} />;
}
