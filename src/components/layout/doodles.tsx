import type { ReactNode } from "react";

const STROKE = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.6,
} as const;

export function CookieMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <circle cx="0" cy="0" r="11" />
      <circle cx="-3.6" cy="-3.2" r="1.15" fill={ink} stroke="none" />
      <circle cx="3.4" cy="-4.1" r="1.05" fill={ink} stroke="none" />
      <circle cx="4.2" cy="2.4" r="1.2" fill={ink} stroke="none" />
      <circle cx="-2.2" cy="4.4" r="0.95" fill={ink} stroke="none" />
      <circle cx="1.1" cy="0.2" r="0.85" fill={ink} stroke="none" />
    </g>
  );
}

export function ShakerMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-4.2 -12.2 h8.4 v2.4 h-8.4 z" />
      <path d="M-5.4 -9.8 h10.8 v2.2 h-10.8 z" />
      <path d="M-5.4 -7.6 h10.8 v12.4 a4.2 4.2 0 0 1 -4.2 4.2 h-2.4 a4.2 4.2 0 0 1 -4.2 -4.2 z" />
      <path d="M-3.2 -0.6 h6.4" />
      <path d="M-2.2 3.2 h4.4" />
    </g>
  );
}

export function DumbbellMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-6.5 0 h13" />
      <rect x="-14.5" y="-5.2" width="4.4" height="10.4" rx="1.4" />
      <rect x="-11.2" y="-3.6" width="3.2" height="7.2" rx="1.1" />
      <rect x="8" y="-3.6" width="3.2" height="7.2" rx="1.1" />
      <rect x="10.1" y="-5.2" width="4.4" height="10.4" rx="1.4" />
    </g>
  );
}

export function BarbellMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink} strokeWidth={1.55}>
      <path d="M-16.5 0 h33" />
      <rect x="-16.6" y="-7.2" width="3.1" height="14.4" rx="1.1" />
      <rect x="-13.4" y="-5.4" width="2.6" height="10.8" rx="1" />
      <rect x="-10.7" y="-3.6" width="2.1" height="7.2" rx="0.9" />
      <rect x="8.6" y="-3.6" width="2.1" height="7.2" rx="0.9" />
      <rect x="10.8" y="-5.4" width="2.6" height="10.8" rx="1" />
      <rect x="13.5" y="-7.2" width="3.1" height="14.4" rx="1.1" />
    </g>
  );
}

export function Doodle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg aria-hidden viewBox="-20 -16 40 32" className={className}>
      {children}
    </svg>
  );
}
