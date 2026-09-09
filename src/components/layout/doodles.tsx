import type { ReactNode } from "react";

const STROKE = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.7,
} as const;

export function CookieMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M0 -11 A 11 11 0 1 0 11 0 A 4.4 4.4 0 0 1 5.5 -5.5 A 4.4 4.4 0 0 1 0 -11 Z" />
      <circle cx="-3.6" cy="-2.6" r="1.15" fill={ink} stroke="none" />
      <circle cx="1.6" cy="1.4" r="1.05" fill={ink} stroke="none" />
      <circle cx="-4.4" cy="3.8" r="1.2" fill={ink} stroke="none" />
      <circle cx="4.4" cy="5.2" r="1.05" fill={ink} stroke="none" />
      <circle cx="-0.4" cy="7" r="0.9" fill={ink} stroke="none" />
    </g>
  );
}

export function MugMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-4.4 -8.2 C-5 -10.6 -3.4 -11.4 -4 -14" />
      <path d="M-0.2 -8.4 C-1 -11 0.8 -11.6 0.2 -14.4" />
      <path d="M3.8 -8 C3 -10.4 4.6 -11.2 4 -13.6" />
      <path d="M-8.6 -6.4 H6.6 V4 C6.6 10.2 -8.6 10.2 -8.6 4 Z" />
      <path d="M6.6 -3.2 C14.8 -3.6 15.2 7 6.6 6.4" />
      <path d="M-11.2 12.2 C-3.6 15.2 5.2 15.2 12.8 12.2" />
    </g>
  );
}

export function DumbbellMark({ ink = "currentColor" }: { ink?: string }) {
  const head = {
    fill: "none",
    stroke: ink,
    strokeWidth: 1.7,
    strokeLinejoin: "miter" as const,
    strokeLinecap: "butt" as const,
    strokeMiterlimit: 2.2,
  };

  return (
    <g>
      <path
        {...head}
        d="M-15.4 -7.4 H-8.8 L-4.4 -2.2 V2.2 L-8.8 7.4 H-15.4 L-18 2.2 V-2.2 Z"
      />
      <path
        {...head}
        d="M8.8 -7.4 H15.4 L18 -2.2 V2.2 L15.4 7.4 H8.8 L4.4 2.2 V-2.2 Z"
      />
      <path
        d="M-4.4 0 H4.4"
        fill="none"
        stroke={ink}
        strokeWidth={2.3}
        strokeLinecap="round"
      />
    </g>
  );
}

export function BarbellMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M-19.2 0 H19.2" />
      <rect x="-18" y="-4.6" width="2" height="9.2" rx="0.85" />
      <rect x="-16" y="-6.6" width="2.4" height="13.2" rx="0.95" />
      <rect x="-13.6" y="-8.4" width="2.8" height="16.8" rx="1" />
      <rect x="10.8" y="-8.4" width="2.8" height="16.8" rx="1" />
      <rect x="13.6" y="-6.6" width="2.4" height="13.2" rx="0.95" />
      <rect x="16" y="-4.6" width="2" height="9.2" rx="0.85" />
    </g>
  );
}

export const DUMBBELL_VIEWBOX = "-19 -8.2 38 16.4";

export function Doodle({
  children,
  className,
  viewBox = "-22 -18 44 38",
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) {
  return (
    <svg aria-hidden viewBox={viewBox} className={className}>
      {children}
    </svg>
  );
}
