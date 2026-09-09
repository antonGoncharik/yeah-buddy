import type { ReactNode } from "react";

const STROKE = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.7,
} as const;

export function CookieMark({
  ink = "currentColor",
  chips = true,
}: {
  ink?: string;
  chips?: boolean;
}) {
  return (
    <g {...STROKE} stroke={ink}>
      <path d="M0 -11 A 11 11 0 1 0 11 0 A 4.4 4.4 0 0 1 5.5 -5.5 A 4.4 4.4 0 0 1 0 -11 Z" />
      {chips ? (
        <>
          <circle cx="-3.6" cy="-2.6" r="1.15" fill={ink} stroke="none" />
          <circle cx="1.6" cy="1.4" r="1.05" fill={ink} stroke="none" />
          <circle cx="-4.4" cy="3.8" r="1.2" fill={ink} stroke="none" />
          <circle cx="4.4" cy="5.2" r="1.05" fill={ink} stroke="none" />
          <circle cx="-0.4" cy="7" r="0.9" fill={ink} stroke="none" />
        </>
      ) : null}
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

function hexPath(cx: number, cy: number, rx: number, ry: number): string {
  const top = 0.62;
  return [
    `M${(cx - rx).toFixed(2)} ${cy.toFixed(2)}`,
    `L${(cx - rx * top).toFixed(2)} ${(cy - ry).toFixed(2)}`,
    `L${(cx + rx * top).toFixed(2)} ${(cy - ry).toFixed(2)}`,
    `L${(cx + rx).toFixed(2)} ${cy.toFixed(2)}`,
    `L${(cx + rx * top).toFixed(2)} ${(cy + ry).toFixed(2)}`,
    `L${(cx - rx * top).toFixed(2)} ${(cy + ry).toFixed(2)}`,
    "Z",
  ].join("");
}

export function DumbbellMark({ ink = "currentColor" }: { ink?: string }) {
  const rx = 8.15;
  const ry = 6.9;
  const left = -10.35;
  const right = 10.35;

  return (
    <g fill={ink} stroke="none">
      <path d={hexPath(left, 0, rx, ry)} />
      <path d={hexPath(right, 0, rx, ry)} />
      <rect x="-2.55" y="-1.15" width="5.1" height="2.3" rx="1.15" />
      <rect x="-3.85" y="-2.05" width="1.45" height="4.1" rx="0.4" />
      <rect x="2.4" y="-2.05" width="1.45" height="4.1" rx="0.4" />
    </g>
  );
}

function plates(side: 1 | -1, ink: string) {
  const inner = { x: 10.4, w: 3.9, h: 17.2 };
  const mid = { x: 15.65, w: 3.15, h: 12.8 };
  const outer = { x: 20.1, w: 2.45, h: 8.4 };
  const cap = 24.05;

  return (
    <g fill={ink} stroke="none">
      <rect
        x={side < 0 ? -inner.x - inner.w : inner.x}
        y={-inner.h / 2}
        width={inner.w}
        height={inner.h}
        rx={0.85}
      />
      <rect
        x={side < 0 ? -mid.x - mid.w : mid.x}
        y={-mid.h / 2}
        width={mid.w}
        height={mid.h}
        rx={0.75}
      />
      <rect
        x={side < 0 ? -outer.x - outer.w : outer.x}
        y={-outer.h / 2}
        width={outer.w}
        height={outer.h}
        rx={0.65}
      />
      <circle cx={side * cap} cy={0} r={1.25} />
    </g>
  );
}

export function BarbellMark({ ink = "currentColor" }: { ink?: string }) {
  return (
    <g fill={ink} stroke="none">
      <rect x="-24.6" y="-0.75" width="49.2" height="1.5" rx="0.75" />
      {plates(-1, ink)}
      {plates(1, ink)}
    </g>
  );
}

export const COOKIE_VIEWBOX = "-12.8 -12.8 25.6 25.6";
export const MUG_VIEWBOX = "-12.9 -16.2 29.8 33.2";
export const DUMBBELL_VIEWBOX = "-19.2 -7.6 38.4 15.2";
export const BARBELL_VIEWBOX = "-25.8 -9.6 51.6 19.2";

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
