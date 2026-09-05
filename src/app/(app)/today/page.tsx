import { TodayScreen } from "@/components/day/today-screen";

export default async function TodayPage({ searchParams }: PageProps<"/today">) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : undefined;
  return <TodayScreen initialDate={date} />;
}
