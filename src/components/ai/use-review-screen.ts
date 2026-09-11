"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { parseReviewSnapshot } from "@/lib/ai/parse-review";
import type { ReviewSnapshot } from "@/lib/ai/types";
import { mutateJson, postJson } from "@/lib/api-cache";
import { AI_REVIEW_FAILED, LOAD_FAILED } from "@/lib/messages";

export type ReviewRangeId = "14" | "30";

export function useReviewScreen() {
  const from = useSearchParams().get("from");
  const [range, setRange] = useState<ReviewRangeId>("14");
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days: ReviewRangeId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mutateJson(`/api/ai/review?days=${days}`);
      const next = readSnapshot(data);
      if (!next) {
        setError(LOAD_FAILED);
        setSnapshot(null);
        return;
      }
      setSnapshot(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  async function writeReview() {
    setWriting(true);
    setError(null);
    try {
      const data = await postJson("/api/ai/review", { days: Number(range) });
      const next = readSnapshot(data);
      if (!next) {
        setError(AI_REVIEW_FAILED);
        return;
      }
      setSnapshot(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : AI_REVIEW_FAILED);
    } finally {
      setWriting(false);
    }
  }

  function changeRange(id: ReviewRangeId) {
    setRange(id);
    setSnapshot(null);
  }

  const brief = snapshot?.brief ?? null;
  const review = snapshot?.review ?? null;
  const empty = brief?.coverage === "empty";

  return {
    from,
    range,
    snapshot,
    loading,
    writing,
    error,
    brief,
    review,
    empty,
    load,
    writeReview,
    changeRange,
  };
}

export function reviewBackHref(from: string | null): string {
  switch (from) {
    case "food":
      return "/today/history";
    case "gym":
      return "/workouts/history";
    case "workouts":
      return "/workouts";
    default:
      return "/settings";
  }
}

function readSnapshot(data: unknown): ReviewSnapshot | null {
  return parseReviewSnapshot(data);
}
