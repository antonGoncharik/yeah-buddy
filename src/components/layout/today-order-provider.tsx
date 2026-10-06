"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { persistTodayOrder, type TodayOrder } from "@/lib/today-order";

const TodayOrderContext = createContext<{
  order: TodayOrder;
  setOrder: (order: TodayOrder) => void;
} | null>(null);

export function TodayOrderProvider({
  children,
  initialOrder,
}: {
  children: React.ReactNode;
  initialOrder: TodayOrder;
}) {
  const [order, setOrderState] = useState(initialOrder);

  const setOrder = useCallback((next: TodayOrder) => {
    persistTodayOrder(next);
    setOrderState(next);
  }, []);

  const value = useMemo(() => ({ order, setOrder }), [order, setOrder]);

  return (
    <TodayOrderContext.Provider value={value}>
      {children}
    </TodayOrderContext.Provider>
  );
}

export function useTodayOrder() {
  const context = useContext(TodayOrderContext);
  if (!context) {
    throw new Error("useTodayOrder must be used within TodayOrderProvider");
  }
  return context;
}
