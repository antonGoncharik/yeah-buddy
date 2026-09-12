import { redirect } from "next/navigation";

import { reviewHref } from "@/lib/ai/review-nav";

export default async function SettingsReviewRedirect({
  searchParams,
}: PageProps<"/settings/review">) {
  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : null;
  redirect(reviewHref(from));
}
