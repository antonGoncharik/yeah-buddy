"use client";

import { useCallback, useRef, useState } from "react";

export function useFirstLoad() {
  const seen = useRef(false);
  const [loading, setLoading] = useState(true);

  const begin = useCallback((force = false) => {
    if (force || !seen.current) {
      setLoading(true);
    }
  }, []);

  const done = useCallback((ok: boolean) => {
    if (ok) {
      seen.current = true;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    seen.current = false;
  }, []);

  return { loading, begin, done, reset };
}
