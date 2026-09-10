"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cachedGet, fetchJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { isRecord, mapRecordList } from "@/lib/read";

export const HISTORY_RANGE_OPTIONS: Array<{ id: "14" | "30"; label: string }> =
  [
    { id: "14", label: "14 дней" },
    { id: "30", label: "30 дней" },
  ];

export function readCursorPage<T>(
  data: unknown,
  parseItem: (row: Record<string, unknown>) => T | null,
): { items: T[]; next_before: string | null } {
  if (!isRecord(data)) {
    return { items: [], next_before: null };
  }

  return {
    items: mapRecordList(data.items, parseItem),
    next_before: typeof data.next_before === "string" ? data.next_before : null,
  };
}

export function useCursorHistory<T>(
  path: string,
  parseItem: (row: Record<string, unknown>) => T | null,
) {
  const parseRef = useRef(parseItem);
  parseRef.current = parseItem;

  const [items, setItems] = useState<T[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (before?: string) => {
      const appending = Boolean(before);
      if (appending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const query = before ? `?before=${encodeURIComponent(before)}` : "";
        const url = `${path}${query}`;
        if (appending) {
          const data = await fetchJson(url);
          const page = readCursorPage(data, parseRef.current);
          setItems((current) => [...current, ...page.items]);
          setNextBefore(page.next_before);
        } else {
          await cachedGet(url, (data) => {
            const page = readCursorPage(data, parseRef.current);
            setItems(page.items);
            setNextBefore(page.next_before);
            return true;
          });
        }
      } catch {
        setError(LOAD_FAILED);
        if (!appending) {
          setItems([]);
          setNextBefore(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [path],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { items, nextBefore, loading, loadingMore, error, load };
}
