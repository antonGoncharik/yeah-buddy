"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type DiaryDensity, persistDiaryDensity } from "@/lib/diary-density";

const DiaryDensityContext = createContext<{
  density: DiaryDensity;
  setDensity: (density: DiaryDensity) => void;
} | null>(null);

export function DiaryDensityProvider({
  children,
  initialDensity,
}: {
  children: React.ReactNode;
  initialDensity: DiaryDensity;
}) {
  const [density, setDensityState] = useState(initialDensity);

  const setDensity = useCallback((next: DiaryDensity) => {
    persistDiaryDensity(next);
    document.documentElement.dataset.density = next;
    setDensityState(next);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  const value = useMemo(() => ({ density, setDensity }), [density, setDensity]);

  return (
    <DiaryDensityContext.Provider value={value}>
      {children}
    </DiaryDensityContext.Provider>
  );
}

export function useDiaryDensity() {
  const context = useContext(DiaryDensityContext);
  if (!context) {
    throw new Error("useDiaryDensity must be used within DiaryDensityProvider");
  }
  return context;
}
