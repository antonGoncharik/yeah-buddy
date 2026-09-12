import { Suspense } from "react";

import { ReviewScreen } from "@/components/ai/review-screen";

export default function ProgressPage() {
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
