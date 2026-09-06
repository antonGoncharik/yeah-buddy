import { notFound } from "next/navigation";

import { MealTemplateScreen } from "@/components/settings/meal-template-screen";
import { isDayType } from "@/lib/nutrition";

export default async function MealTemplatePage({
  params,
}: {
  params: Promise<{ dayType: string }>;
}) {
  const { dayType } = await params;
  if (!isDayType(dayType)) {
    notFound();
  }

  return <MealTemplateScreen dayType={dayType} />;
}
