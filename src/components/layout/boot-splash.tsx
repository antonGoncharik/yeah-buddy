"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import { createBootHold } from "@/lib/boot-splash";

type BootSplash = {
  active: boolean;
  hold: () => () => void;
  armIfIdle: () => void;
};

const BootSplashContext = createContext<BootSplash | null>(null);

export function BootSplashProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(true);
  const api = useMemo(() => createBootHold(() => setActive(false)), []);
  const value = useMemo(
    () => ({ active, hold: api.hold, armIfIdle: api.armIfIdle }),
    [active, api],
  );

  return (
    <BootSplashContext.Provider value={value}>
      {children}
    </BootSplashContext.Provider>
  );
}

export function useBootSplash() {
  return useContext(BootSplashContext);
}
