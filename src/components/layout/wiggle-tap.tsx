"use client";

import { type ReactNode, useCallback, useState } from "react";

import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function useWiggle() {
  const [token, setToken] = useState(0);

  const play = useCallback(() => {
    setToken((current) => current + 1);
  }, []);

  const wiggle = useCallback(() => {
    haptic("tick");
    play();
  }, [play]);

  return {
    play,
    wiggle,
    token,
    className: token > 0 ? "animate-dumbbell-wiggle" : undefined,
    onAnimationEnd: () => setToken(0),
  };
}

export function WiggleTap({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const { wiggle, token, className: motion, onAnimationEnd } = useWiggle();

  return (
    <button
      type="button"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      tabIndex={label ? undefined : -1}
      className={cn("inline-flex", className)}
      onClick={wiggle}
    >
      <span
        key={token}
        className={cn("inline-flex", motion)}
        onAnimationEnd={onAnimationEnd}
      >
        {children}
      </span>
    </button>
  );
}
