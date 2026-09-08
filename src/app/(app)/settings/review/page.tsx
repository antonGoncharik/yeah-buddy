import { Suspense } from "react";

import { ReviewScreen } from "@/components/ai/review-screen";

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
